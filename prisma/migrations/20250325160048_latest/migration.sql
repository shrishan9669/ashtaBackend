-- CreateTable
CREATE TABLE "Purchase" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "purchaseid" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "verify" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_number_key" ON "Purchase"("number");
