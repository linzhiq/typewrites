-- CreateTable
CREATE TABLE "Document" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Line" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "docId" INTEGER NOT NULL,
    "lineNumber" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Edit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docId" INTEGER NOT NULL,
    "lineIdx" INTEGER NOT NULL,
    "charIdx" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EditToLine" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Line.docId_lineNumber_unique" ON "Line"("docId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_EditToLine_AB_unique" ON "_EditToLine"("A", "B");

-- CreateIndex
CREATE INDEX "_EditToLine_B_index" ON "_EditToLine"("B");

-- AddForeignKey
ALTER TABLE "Line" ADD FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edit" ADD FOREIGN KEY ("docId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EditToLine" ADD FOREIGN KEY ("A") REFERENCES "Edit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EditToLine" ADD FOREIGN KEY ("B") REFERENCES "Line"("id") ON DELETE CASCADE ON UPDATE CASCADE;
