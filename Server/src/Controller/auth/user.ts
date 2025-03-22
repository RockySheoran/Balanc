import {Request , Response} from 'express';

export const user = async (req:Request , res:Response) => {
    try {
        const user  = req.user;
        res.status(200).json({data:{user}});
        
    } catch (error) {
        
    }
}
