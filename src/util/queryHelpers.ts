import { FindManyOptions, FindOptionsWhere } from 'typeorm';
import { GraphQLError } from 'graphql';

export function genOptsFromQuery<T>(requireArgs: boolean, where: { [key: string]: any }): FindManyOptions<T> {
  let relations: string[] = [];
  let seenArgs = 0;
  for (const key in where) {
    if (where[key] === null || where[key] === undefined) {
      delete where[key];
      continue;
    }

    if (typeof where[key] === 'object') {
      if (!relations.includes(key)) {
        relations.push(key);
      }
    }
    seenArgs++;
  }

  if (requireArgs && seenArgs < 1) {
    throw new GraphQLError('At least one argument is required', {
      extensions: {
        Code: 'Bad Request',
      }
    });
  }

  const result: FindManyOptions<T> = {
    where: where as FindOptionsWhere<T>,
  };

  if (relations.length) {
    result.relations = relations;
  }

  return result;
}
