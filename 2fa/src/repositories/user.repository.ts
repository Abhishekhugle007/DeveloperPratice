import type {IUserRepository,UserFilter,UserUpdate,UserUpdateResult,} from "../interfaces/user.interface";
import type { IUserSchema } from "../types/user.types";
import userModel from "../models/user.models";

export default class UserRepository implements IUserRepository {
  findOne(
    filter: UserFilter,
    select?: string
  ): Promise<IUserSchema | null> {
    const query = userModel.findOne(filter)
    if (select !== undefined) {
      query.select(select)
    }
    return query.lean<IUserSchema>().exec()
  }

  create(payload: IUserSchema): Promise<IUserSchema> {
    return userModel.create(payload)
  }

  updateOne(filter: UserFilter, update: UserUpdate): UserUpdateResult {
    return userModel.updateOne(filter, update).exec()
  }
}