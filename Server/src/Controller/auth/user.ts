import {Request , Response} from 'express';

export const user = async (req:Request , res:Response) :Promise<any> => {
    try {
        const user  = req.user;
        res.status(200).json({data:{user}});
        
    } catch (error) {
        return res.status(422).json({message:"user not found"})
        
    }
}
