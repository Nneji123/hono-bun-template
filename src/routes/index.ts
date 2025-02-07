import { Hono } from 'hono';
import nameRoutes from './name.routes';

const routes = new Hono();

routes.get('/', (c) => {
    return c.text('hono!');
});

routes.route('/names', nameRoutes);

export default routes;