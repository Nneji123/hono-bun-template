import { Context } from 'hono';

export const getAllNames = (c: Context) => {
    const names = ['Alice', 'Bob', 'Charlie'];
    return c.json(names);
};

export const createName = async (c: Context) => {
    const body = await c.req.parseBody();
    const newName = body.name;

    if (!newName) {
        return c.json({ error: 'Name is required' }, 400);
    }

    const addedName = { id: Date.now(), name: newName };
    return c.json(addedName, 201);
};

export const getNameById = (c: Context) => {
    const id = c.req.param('id');
    const name = { id: id, name: `Example Name for ID ${id}` }; // Simulate data

    if (!name) {
        return c.json({ error: 'Name not found' }, 404);
    }

    return c.json(name);
};