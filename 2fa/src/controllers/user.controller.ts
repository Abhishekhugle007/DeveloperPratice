import { RequestHandler } from "express-serve-static-core";
import { IUserController, IUserRequestData, IUserService } from "../interfaces/user.interface";
import { loginUserValidator, recovery2FAValidator, registerUserValidator, verify2FAValidator } from "../validators/user.validator";
import { getCookieOptions } from "../helpers/cookie.helper";
import { IAuthenticatedRequest } from "../types/auth.type";

export default class UserController implements IUserController {
   constructor(private userService: IUserService) {}

   register: RequestHandler = async (req, res, next) => {
      const body = req.body as IUserRequestData['register']['body'];

      // validate
      const { success, data, error } = registerUserValidator.safeParse(body);

      if (!success) {
         next(error);
         return;
      }

      const response = await this.userService.register(data);
      res.status(201).json(response);
   };

   login: RequestHandler = async (req, res, next) => {
      const body = req.body as IUserRequestData['login']['body'];

      // validate
      const { success, data, error } =loginUserValidator.safeParse(body);

      if (!success) {
         next(error);
         return;
      }

      const response = await this.userService.login(data);
    //set cookies
      const cookieOptions = getCookieOptions({ purpose: "auth", type: "minute", value: 5 });
      res.cookie("accessToken", response.data.accessToken, cookieOptions);
      res.status(200).json(response);
   };

   activate2FA: RequestHandler = async (req, res, next) => {
      const { user } = req as IAuthenticatedRequest;
      const response = await this.userService.activate2FA(user);
      res.status(200).json(response);
   };

   recovery2FA: RequestHandler = async (req, res, next) => {
      const {user} = req as IAuthenticatedRequest
      const body = req.body as IUserRequestData['recovery2FA']['body'];

      // validate
      const { success, data, error } = recovery2FAValidator.safeParse(body);

      if (!success) {
         next(error);
         return;
      }

      const response = await this.userService.recover2FA(user,data);
    //set cookies
      const cookieOptions = getCookieOptions({ purpose: "auth", type: "day", value: 1});
      res.cookie("accessToken", response.data.accessToken, cookieOptions);
      res.status(200).json(response);
   };
   verify2FA: RequestHandler = async (req, res, next) => {
      const {user} = req as IAuthenticatedRequest
      const body = req.body as IUserRequestData['verify2FA']['body'];

      // validate
      const { success, data, error } = verify2FAValidator.safeParse(body);

      if (!success) {
         next(error);
         return;
      }

      const response = await this.userService.verify2FA(user,data);
    //set cookies
      const cookieOptions = getCookieOptions({ purpose: "auth", type: "day", value: 1});
      res.cookie("accessToken", response.data.accessToken, cookieOptions);
      res.status(200).json(response);
   };

   me: RequestHandler = async (req, res, next) => {
      const {user} = req as IAuthenticatedRequest
      const response = await this.userService.me(user);
      res.status(200).json(response);
   }
   logout: RequestHandler = async (req, res, next) => {
      const {user} = req as IAuthenticatedRequest
      const response = await this.userService.logout(user); 

      //cookie
      const cookieOptions = getCookieOptions({ purpose: "logout"});
      for (const cookie of Object.keys(req.cookies)) {
         res.cookie(cookie, "", cookieOptions)
      }
      res.status(200).json(response);
   }

   reset2FA: RequestHandler = async (req, res, next) => {
      
      const {user} = req as IAuthenticatedRequest
      const response = await this.userService.reset2FA(user);
    //set cookies
      const cookieOptions = getCookieOptions({ purpose: "auth", type: "minute", value: 5 });
      res.cookie("accessToken", response.data.accessToken, cookieOptions);
      res.status(200).json(response);
   };

}