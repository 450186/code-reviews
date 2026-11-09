-- CreateTable
CREATE TABLE "SavedView" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "countryCodes" TEXT NOT NULL,
    "sortOrder" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedView_name_key" ON "SavedView"("name");
