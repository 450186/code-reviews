-- CreateTable
CREATE TABLE "Country" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "iso2Code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "regionCode" TEXT NOT NULL,
    "incomeLevel" TEXT NOT NULL,
    "incomeLevelCode" TEXT NOT NULL,
    "capitalCity" TEXT,
    "latitude" REAL,
    "longitude" REAL
);

-- CreateTable
CREATE TABLE "Indicator" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sourceNote" TEXT,
    "sourceOrganization" TEXT,
    "lastFetchedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "countryCode" TEXT NOT NULL,
    "indicatorCode" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    CONSTRAINT "Observation_countryCode_fkey" FOREIGN KEY ("countryCode") REFERENCES "Country" ("code") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Observation_indicatorCode_fkey" FOREIGN KEY ("indicatorCode") REFERENCES "Indicator" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_iso2Code_key" ON "Country"("iso2Code");

-- CreateIndex
CREATE INDEX "Observation_indicatorCode_year_idx" ON "Observation"("indicatorCode", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Observation_countryCode_indicatorCode_year_key" ON "Observation"("countryCode", "indicatorCode", "year");
