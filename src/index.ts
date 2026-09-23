import 'temporal-polyfill/full/global';
import app from './api/app.js';

const PORT = process.env['PORT'] ?? 3000;

app.listen(PORT, () => {
	console.log(`Taskly API listening on port ${PORT}`);
});
