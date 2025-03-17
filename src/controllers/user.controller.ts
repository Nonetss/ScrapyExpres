import { Request, Response } from "express";

export const getUsers = (req: Request, res: Response) => {
  res.json([
    { id: 1, name: "Juan" },
    { id: 2, name: "Ana" },
  ]);
};
