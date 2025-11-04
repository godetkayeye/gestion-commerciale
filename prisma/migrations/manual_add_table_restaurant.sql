-- Manual SQL to create the `table_restaurant` table used by Prisma model `table_restaurant`.
-- Run this on the database server if `prisma migrate` fails due to server issues.
-- Backup your database before running any DDL.

CREATE TABLE IF NOT EXISTS `table_restaurant` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numero` varchar(191) NOT NULL,
  `capacite` int NOT NULL DEFAULT 1,
  `statut` enum('libre','occupée','en attente') NOT NULL DEFAULT 'libre',
  `date_creation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_unique` (`numero`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
