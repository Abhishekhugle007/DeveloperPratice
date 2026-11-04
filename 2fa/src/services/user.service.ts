import { ApplicationException } from "../helpers/error.helper";
import { compareValue, hashValue } from "../helpers/encryption.helper";
import { serviceSuccess } from "../helpers/service.helper";
import { IUserRepository, IUserRequestData, IUserService } from "../interfaces/user.interface";
import { TJwtPayload } from "../types/jwt.types";
import { singJWT } from "../helpers/jwt.helper";
import envConfig from "../configs/env.config";
import { generateDaysSeconds, generateMinutesSeconds } from "../helpers/date-time.helper";
import { generateRecoveryCodes, generateTOTP } from "../helpers/2fa.helper";
import { createQRCodeDataURL } from "../helpers/qr.helper";



export default class UserService implements IUserService{
constructor(private userRepository: IUserRepository) {
       
}
  register= async(payload: IUserRequestData["register"]["body"]) => {
    // find the already register
    const user = await this.userRepository.findOne({
        email:payload.email
    })
    if(user){
        throw new ApplicationException(400, 'User Already exist')
    }
    //hash password
    const hashPassword = await hashValue(payload.password)

    
    // register user
    const newUser = await this.userRepository.create({
        name:payload.name,
        email:payload.email,
        password:hashPassword,
        twoFactorAuth:{
            activated:false,
            secret:null,
            recoveryCodes:[]
        }
    })
    return serviceSuccess("User registered",{
        userId: String(newUser._id)
    })

  }

  login =async (payload:IUserRequestData["login"]["body"]) =>{
     
    const user = await this.userRepository.findOne({
        email:payload.email
    }, "+password")
    if(!user){
        throw new ApplicationException(400, 'Invalid credentials')
    }


    //compare password

    const enteredPassword = payload.password
    const hashedPassword = user.password

    const isValidPassword = await compareValue(enteredPassword,hashedPassword)
    if(!isValidPassword){
       throw new ApplicationException(400, 'Invalid credentials')
    }
    

    //Token Generation

    const tokenPayload: TJwtPayload ={
        userId: String(user._id),
        stage:'password'
    }

    if (!envConfig.ACCESS_TOKEN_SECRET) {
      throw new ApplicationException(500, "Access token secret is not configured")
    }
    const accessToken = singJWT(tokenPayload, envConfig.ACCESS_TOKEN_SECRET, generateMinutesSeconds(5))
     return serviceSuccess("Logged in", {
        userId:String(user. _id),
        accessToken
     })
  }
  activate2FA = async (user: IUserRequestData["activate2FA"]["user"]) => {
    const is2FAActivated = user.twoFactorAuth.activated
    if(is2FAActivated){
        throw new ApplicationException(400, "Already activated")
    }

    //TOTP generation

    const totp = generateTOTP(user.email, user.twoFactorAuth.secret ?? undefined)
    const otpAuth = totp.toString()
    const qrDataUrl = await createQRCodeDataURL(otpAuth)

    // properties

    const secret = totp.secret.base32
   

    //update user
    const updateUser = await this.userRepository.updateOne({
        _id: user._id
    },{
        $set:{
            'twoFactorAuth.secret': secret,
            
        }
    })
    if(updateUser.modifiedCount === 0){
      throw new ApplicationException(400, "Activation failed")
    }
    return serviceSuccess("Activation loaded",{
      qrDataUrl,
      
    })
  }

  recover2FA = async (user: IUserRequestData["recovery2FA"]["user"], payload: IUserRequestData["recovery2FA"]["body"]) => {
    const is2FAActivated = user.twoFactorAuth.activated
    if(!is2FAActivated){
        throw new ApplicationException(400, "2FA is not activated")
    }
    const nonUserRecoveryCodes = user.twoFactorAuth.recoveryCodes.filter((rc) => !rc.used)
    let validRCCode: string | null = null
    for (const rc of nonUserRecoveryCodes) {
        if (await compareValue(payload.recoveryCode, rc.code)) {
            validRCCode = rc.code
            break
        }
    }
    if (!validRCCode) {
        throw new ApplicationException(400, "Invalid recovery code")
    }
    // mark the recovery code as used
    const updateRecoveryCode = user.twoFactorAuth.recoveryCodes.map((rc) => {
        if(rc.code === validRCCode){
            return{
                code: rc.code,
                used: true
            }
        }
        return rc
    })

    const updaterUser = await this.userRepository.updateOne({
        _id: user._id
    },{
        $set:{
            'twoFactorAuth.recoveryCodes': updateRecoveryCode
        }
    })
    if(updaterUser.modifiedCount === 0){
        throw new ApplicationException(400, "Recovery failed")
    }
    // generate access token

    const tokenPayload: TJwtPayload ={
        userId: String(user._id),
        stage:'2fa'
    }

    
    if (!envConfig.ACCESS_TOKEN_SECRET) {
      throw new ApplicationException(500, "Access token secret is not configured")
    }
    const accessToken = singJWT(tokenPayload, envConfig.ACCESS_TOKEN_SECRET, generateDaysSeconds(1))
     return serviceSuccess("Logged in using recovery code", {
        userId:String(user. _id),
        accessToken
     })
  }
  verify2FA = async (user: IUserRequestData["verify2FA"]["user"], payload: IUserRequestData["verify2FA"]["body"]) => {
    const secret = user.twoFactorAuth.secret
    if (!secret) {
      throw new ApplicationException(400, "2FA has not been set up")
    }

    const totp = generateTOTP(user.email, secret)
    const delta = totp.validate({
        token:payload.totp,
        window: 1
    })
    if(delta === null){
        throw new ApplicationException(400, "Verification failed")
    }

    const is2FAActivated = user.twoFactorAuth.activated
    let plainTextRecoveryCodes: string[] = []
    if(!is2FAActivated){
        const recoveryCodes = await generateRecoveryCodes(10)
        const updateUser = await this.userRepository.updateOne({
        _id: user._id
    },{
        $set:{
            'twoFactorAuth.activated': true,
            'twoFactorAuth.recoveryCodes': recoveryCodes.hashed.map((code) => {
                return{
                    code,
                    used:false
                }
            })
        }
    })
    if(updateUser.modifiedCount === 0){
      throw new ApplicationException(400, "Verification failed")
    }
        plainTextRecoveryCodes = recoveryCodes.plainText
    }
    // genertate token

    const tokenPayload: TJwtPayload ={
        userId: String(user._id),
        stage:'2fa'
    }

    if (!envConfig.ACCESS_TOKEN_SECRET) {
      throw new ApplicationException(500, "Access token secret is not configured")
    }
    const accessToken = singJWT(tokenPayload, envConfig.ACCESS_TOKEN_SECRET, generateDaysSeconds(1))
     return serviceSuccess("Logged in", {
        userId:String(user._id),
        accessToken,
        recoveryCodes: plainTextRecoveryCodes
     })
  }

  me = async (user: IUserRequestData["me"]["user"]) => {
    return serviceSuccess("User details loaded", {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      twoFactorAuth: {
        activated: user.twoFactorAuth.activated
      }
    })
  }

  logout = async (user: IUserRequestData["logout"]["user"]) => {
    return serviceSuccess("Logged out", {
      userId: String(user._id)
    })
  }

  reset2FA = async (user: IUserRequestData["reset2FA"]["user"]) => {
    if (!envConfig.ACCESS_TOKEN_SECRET) {
      throw new ApplicationException(500, "Access token secret is not configured")
    }

    if (!user.twoFactorAuth.activated) {
      throw new ApplicationException(400, "2FA is not activated")
    }

    const updateUser = await this.userRepository.updateOne({
        _id: user._id
    },{
        $set:{
            "twoFactorAuth.activated": false,
            "twoFactorAuth.recoveryCodes": [],
            "twoFactorAuth.secret": null
        }
    })
    if (updateUser.modifiedCount === 0) {
      throw new ApplicationException(400, "Failed to reset 2FA")
    }

    const tokenPayload: TJwtPayload = {
        userId: String(user._id),
        stage: "password"
    }

    const accessToken = singJWT(tokenPayload, envConfig.ACCESS_TOKEN_SECRET, generateMinutesSeconds(5))
    return serviceSuccess("2FA reset successfully", {
        userId: String(user._id),
        accessToken
    })
  }
  }
