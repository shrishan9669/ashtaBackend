/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `number` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "number" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_number_key" ON "user"("number");
