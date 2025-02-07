import { Hono } from 'hono';
import { getAllNames, createName, getNameById } from '../controllers/name.controller'; // Import controllers

const nameRoutes = new Hono();

nameRoutes.get('/', getAllNames);       // Use the controller function
nameRoutes.post('/', createName);      // Use the controller function
nameRoutes.get('/:id', getNameById);   // Use the controller function

export default nameRoutes;