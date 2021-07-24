import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { watch, FSWatcher } from 'chokidar';

// Paths
const projectDir: string = path.join(__dirname, '..');
const sourceDir: string = './src';
const indexFile: string = './index.ts';
const distDir: string = './dist';

/**
 * Watch the source directory (src)
 */
export const watcher: FSWatcher = watch(sourceDir, {
	cwd: projectDir
});

/**
 * Run process and pipe its output and resolve after execution
 *
 * @param name Process name
 * @param checkCode Break the chain when a process failed or not
 */
export async function spwanHere(
	name: string,
	command: string,
	args: string[]
): Promise<[ChildProcess, Promise<void>]> {
	const childProccess: ChildProcess = spawn(command, args, {
		cwd: projectDir,
		stdio: ['ignore', 'inherit', 'inherit']
	});

	console.log('\n' + '<' + name + '>');

	return [
		childProccess,
		new Promise((resolve: Function, reject: Function) =>
			childProccess.on('exit', (code: number) => {
				console.log('<' + name.split('(')[0] + '>');
				code === 0 ? resolve() : reject();
			})
		)
	];
}

export const isExtInList = (fileAddress: string, extList: string[]): boolean => {
	fileAddress = fileAddress.split('/').slice(-1)[0];

	return extList.map(ext => fileAddress.endsWith('.' + ext)).includes(true);
};

if (module === require.main) {
	// Process flow
	const processes = ((): Function => {
		let lastNodeChildProcess: ChildProcess;
		let inProcess = false;

		const buildMode: boolean = process.argv.includes('--build');
		const compileMode: boolean = process.argv.includes('--compile') || buildMode;

		return async function processes(fileAddress?: string): Promise<void> {
			if (inProcess) return;
			else inProcess = true;

			// format:prettier
			try {
				if (!fileAddress || isExtInList(fileAddress, ['ts', 'js', 'cjs', 'mjs', 'json'])) {
					const [, prettierOnExit] = await spwanHere(
						'format:prettier' + (fileAddress ? `(${fileAddress})` : ''),
						'npx',
						['prettier', '--write', fileAddress || sourceDir]
					);

					await prettierOnExit;
				}
			} catch (ChildProcess) {}

			// lint:fix
			try {
				if (!fileAddress || isExtInList(fileAddress, ['ts', 'js', 'cjs', 'mjs', 'json'])) {
					const [, eslintOnExit] = await spwanHere(
						'lint:fix' + (fileAddress ? `(${fileAddress})` : ''),
						'npx',
						['eslint', '--fix', fileAddress || sourceDir]
					);

					await eslintOnExit;
				}
			} catch (childProcess) {}

			// test:ava
			try {
				if (
					!fileAddress ||
					(fileAddress.includes('.test.') &&
						isExtInList(fileAddress, ['ts', 'js', 'cjs', 'mjs']))
				) {
					const [, avaOnExit] = await spwanHere(
						'test:ava' + (fileAddress ? `(${fileAddress})` : ''),
						'npx',
						['ava', fileAddress || path.join(sourceDir, './**/*.test.*')]
					);

					await avaOnExit;
				}
			} catch (childProcess) {}

			if (!fileAddress || !fileAddress.includes('.test.')) {
				if (
					lastNodeChildProcess &&
					lastNodeChildProcess.exitCode === null &&
					!lastNodeChildProcess.killed
				)
					lastNodeChildProcess.kill();

				if (compileMode) {
					// build:clean
					try {
						if (!fileAddress) {
							const [, rimrafOnExit] = await spwanHere('clean:rimraf', 'npx', [
								'rimraf',
								distDir
							]);

							await rimrafOnExit;
						}
					} catch (childProcess) {}

					// compile:tsc
					try {
						if (!fileAddress || !fileAddress.includes('.test.')) {
							const [, tscOnExit] = await spwanHere('compile:tsc', 'npx', ['tsc']);

							await tscOnExit;
						}
					} catch (childProcess) {}
				}

				if (!buildMode) {
					// run:node
					try {
						const [nodeChildProcess, nodeOnExit] = await spwanHere(
							'run:node',
							'node',
							!compileMode
								? [
										'--inspect',
										'-r',
										'ts-node/register',
										path.join(sourceDir, indexFile)
								  ]
								: ['--inspect', '.']
						);

						lastNodeChildProcess = nodeChildProcess;

						nodeOnExit.catch(() => {});
					} catch (error) {}
				}
			}
			inProcess = false;
		};
	})();

	// Run the processes
	watcher.on('ready', (): void => {
		processes()
			.then(() => {
				watcher.on('add', (path: string): void => {
					processes(path)
						.then(() => {})
						.catch(() => {});
				});
				watcher.on('change', (path: string): void => {
					processes(path)
						.then(() => {})
						.catch(() => {});
				});
			})
			.catch(() => {});
	});
}
