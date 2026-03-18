-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 17, 2026 at 02:57 AM
-- Server version: 10.11.14-MariaDB-0ubuntu0.24.04.1
-- PHP Version: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `homeAutoServer`
--

-- --------------------------------------------------------

--
-- Table structure for table `room1LightEvents`
--

CREATE TABLE `room1LightEvents` (
  `date` varchar(10) NOT NULL,
  `time` varchar(10) NOT NULL,
  `logEvent` varchar(30) NOT NULL,
  `lightState` int(11) NOT NULL DEFAULT -1,
  `kwPower` float NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `room1LightEvents`
--

INSERT INTO `room1LightEvents` (`date`, `time`, `logEvent`, `lightState`, `kwPower`) VALUES
('16/03/26', '02:11:29', 'onOff', 1, 0),
('16/03/26', '02:14:00', 'measureKw', -1, 0.00197897),
('16/03/26', '02:14:13', 'onOff', 0, 0),
('16/03/26', '02:21:00', 'measureKw', -1, 0.00111037),
('16/03/26', '02:28:00', 'measureKw', -1, 0.00110879),
('16/03/26', '02:35:00', 'measureKw', -1, 0.00110974),
('16/03/26', '02:40:46', 'onOff', 1, 0),
('16/03/26', '02:41:29', 'onOff', 0, 0),
('16/03/26', '02:42:00', 'measureKw', -1, 0.00110185),
('16/03/26', '02:45:16', 'onOff', 1, 0),
('16/03/26', '02:45:35', 'onOff', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `roomsLightUsage`
--

CREATE TABLE `roomsLightUsage` (
  `id` int(11) NOT NULL,
  `date` varchar(10) NOT NULL,
  `room` varchar(30) NOT NULL,
  `totalDuration` varchar(10) NOT NULL DEFAULT '00:00:00',
  `totalKwh` float NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roomsLightUsage`
--

INSERT INTO `roomsLightUsage` (`id`, `date`, `room`, `totalDuration`, `totalKwh`) VALUES
(100000, '12/03/26', 'room1', '09:03:19', 25.6),
(100001, '13/03/26', 'room1', '09:20:55', 27.8),
(100002, '14/03/26', 'room1', '09:13:40', 26),
(100003, '12/03/26', 'room2', '08:20:50', 22.8),
(100004, '13/03/26', 'room2', '12:29:01', 34.8),
(100005, '14/03/26', 'room2', '11:34:56', 32.6);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `room1LightEvents`
--
ALTER TABLE `room1LightEvents`
  ADD UNIQUE KEY `time` (`time`);

--
-- Indexes for table `roomsLightUsage`
--
ALTER TABLE `roomsLightUsage`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `roomsLightUsage`
--
ALTER TABLE `roomsLightUsage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100006;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
