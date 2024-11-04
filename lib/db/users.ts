import { User } from "@prisma/client";
import prisma from "./client";

export const createUser = async (
  email: string,
  userId: string,
  name: string
): Promise<User | null> => {
  try {
    const newUser = await prisma.user.create({
      data: { userId, email, name },
    });
    return newUser;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User | null> => {
  try {
    const updatedUser = await prisma.user.update({
      where: { userId },
      data,
    });
    return updatedUser;
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
};

export const deleteUser = async (userId: string): Promise<User | null> => {
  try {
    const deletedUser = await prisma.user.delete({
      where: { userId },
    });
    return deletedUser;
  } catch (error) {
    console.error("Error deleting user:", error);
    return null;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { userId },
    });
    return user;
  } catch (error) {
    console.error("Error retrieving user:", error);
    return null;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error("Error retrieving user by email:", error);
    return null;
  }
};
