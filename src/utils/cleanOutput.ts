import { Schema } from 'mongoose';

const cleanOutput = (schema: Schema) => {
  const transformOptions = {
    transform: function (doc: any, ret: any) {
      // Convert _id to id
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }

      // Remove version key
      delete ret.__v;

      // Handle private fields in the schema
      schema.eachPath((pathname, schemaType) => {
        if (schemaType.options?.private) {
          delete ret[pathname];
        }
      });

      return ret;
    }
  };

  // Apply transformation to both JSON and Object conversions
  schema.set('toJSON', transformOptions);
  schema.set('toObject', transformOptions);
};

export default cleanOutput;
