import test from 'ava';
import td from 'testdouble';
import { getProducts, IProduct } from '../index';
import data from '../data.json';

const fakeProducts: IProduct[] = [
	{
		id: 0,
		name: 'Apple',
		category: 'smartphone',
		amount: 4
	},
	{
		id: 1,
		name: 'Samsung',
		category: 'smartphone',
		amount: 8
	}
];

test('getProducts method must return correct products', t => {
	const products: IProduct[] = getProducts();

	t.deepEqual(products, data.products);
});

test('getProducts method mocked and must return fake products', t => {
	td.replace('../index', {
		getProducts() {
			return fakeProducts;
		}
	});

	const getProducts = require('../index').getProducts;

	const products: IProduct[] = getProducts();

	t.deepEqual(products, fakeProducts);
});
