-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 15, 2026 at 05:40 AM
-- Server version: 8.0.36
-- PHP Version: 8.4.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `zhpebukm_dnt-wed`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('7367eb4ddc199c8f809d5103aca1b80c4fea7ada:timer', 'i:1776206209;', 1776206209),
('7367eb4ddc199c8f809d5103aca1b80c4fea7ada', 'i:7;', 1776206209),
('5fff40e3e0fbc1d5434fcdbfcb0c3e2818486dc0:timer', 'i:1776200149;', 1776200149),
('5fff40e3e0fbc1d5434fcdbfcb0c3e2818486dc0', 'i:3;', 1776200149);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enquiries`
--

CREATE TABLE `enquiries` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'guest',
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reply_message` text COLLATE utf8mb4_unicode_ci,
  `replied_at` timestamp NULL DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enquiries`
--

INSERT INTO `enquiries` (`id`, `name`, `email`, `type`, `subject`, `message`, `reply_message`, `replied_at`, `status`, `created_at`, `updated_at`) VALUES
(1, 'TR Test', 'tangtzeren@gmail.com', 'guest', 'IS THIS WORKING?', 'IS THIS WORKING OR NOT?', 'Yes, this seems to be working. Can you confirm?', '2026-04-29 17:54:53', 'replied', '2026-04-29 17:50:57', '2026-04-29 17:54:53');

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `venue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `faqs`
--

CREATE TABLE `faqs` (
  `id` bigint UNSIGNED NOT NULL,
  `question` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faqs`
--

INSERT INTO `faqs` (`id`, `question`, `answer`, `order`, `created_at`, `updated_at`) VALUES
(7, '🚗 What’s the best way to get around Nairobi?', '<p>We&nbsp;typically&nbsp;used&nbsp;Ubers&nbsp;to&nbsp;get&nbsp;around&nbsp;Nairobi.&nbsp;<strong>Note&nbsp;that&nbsp;Uber&nbsp;drivers&nbsp;typically&nbsp;prefer&nbsp;cash&nbsp;or&nbsp;M-Pesa</strong>&nbsp;which&nbsp;allows&nbsp;them&nbsp;to&nbsp;get&nbsp;paid&nbsp;immediately&nbsp;rather&nbsp;than&nbsp;the&nbsp;North&nbsp;American&nbsp;default&nbsp;of&nbsp;credit&nbsp;card&nbsp;payment&nbsp;(which&nbsp;delays&nbsp;their&nbsp;payment&nbsp;by&nbsp;a&nbsp;few&nbsp;days).&nbsp;Bolt&nbsp;and&nbsp;Little&nbsp;Cab&nbsp;are&nbsp;also&nbsp;usable&nbsp;ride-hailing&nbsp;apps&nbsp;but&nbsp;I&nbsp;recommend&nbsp;sticking&nbsp;to&nbsp;Uber.&nbsp;If&nbsp;using&nbsp;local&nbsp;taxis,&nbsp;please&nbsp;ensure&nbsp;sufficient&nbsp;cash&nbsp;or&nbsp;M-Pesa&nbsp;for&nbsp;payment&nbsp;and&nbsp;ensure&nbsp;the&nbsp;fare&nbsp;is&nbsp;agreed&nbsp;upon&nbsp;before&nbsp;the&nbsp;ride.&nbsp;The&nbsp;matatus&nbsp;(minibuses)&nbsp;are&nbsp;not&nbsp;recommended&nbsp;for&nbsp;visitors&nbsp;unfamiliar&nbsp;with&nbsp;the&nbsp;city&nbsp;as&nbsp;their&nbsp;routes&nbsp;can&nbsp;be&nbsp;unpredictable.&nbsp;</p><p></p><p>For&nbsp;airport&nbsp;transfers,&nbsp;you&nbsp;can&nbsp;use&nbsp;either&nbsp;an&nbsp;Uber&nbsp;or&nbsp;a&nbsp;taxi.&nbsp;Please&nbsp;let&nbsp;us&nbsp;know&nbsp;if&nbsp;you&nbsp;have&nbsp;questions&nbsp;about&nbsp;this.</p>', 10, '2026-04-27 13:34:00', '2026-05-06 12:34:16'),
(6, '📄 What travel documents do I need?', '<p>You’ll&nbsp;need&nbsp;a&nbsp;<strong>passport&nbsp;valid&nbsp;for&nbsp;at&nbsp;least&nbsp;6&nbsp;months</strong>&nbsp;beyond&nbsp;your&nbsp;travel&nbsp;dates,&nbsp;<strong>a&nbsp;Kenya&nbsp;eVisa</strong>&nbsp;(apply&nbsp;online&nbsp;before&nbsp;arrival&nbsp;–&nbsp;See&nbsp;<a href=\"https://etakenya.go.ke/how-to-apply\" rel=\"noopener noreferrer\" target=\"_blank\" style=\"color: windowtext;\">here</a>),&nbsp;and&nbsp;a&nbsp;<strong>return/onward&nbsp;ticket.</strong>&nbsp;</p><p></p><p>Dinah&nbsp;and&nbsp;I&nbsp;can&nbsp;provide&nbsp;any&nbsp;additional&nbsp;details&nbsp;(like&nbsp;Kenyan&nbsp;address&nbsp;details,&nbsp;Kenyan&nbsp;I.D.,&nbsp;Invitation&nbsp;Letter,&nbsp;etc.)&nbsp;you&nbsp;need&nbsp;for&nbsp;the&nbsp;visa&nbsp;application.&nbsp;Please&nbsp;contact&nbsp;us&nbsp;for&nbsp;it.&nbsp;</p><p></p><p>Please&nbsp;ensure&nbsp;you&nbsp;also&nbsp;have&nbsp;your&nbsp;physical&nbsp;passport,&nbsp;a&nbsp;copy&nbsp;of&nbsp;the&nbsp;eVisa,&nbsp;and&nbsp;a&nbsp;copy&nbsp;of&nbsp;the&nbsp;wedding&nbsp;invitation&nbsp;when&nbsp;you&nbsp;travel.&nbsp;The&nbsp;wedding&nbsp;invitation&nbsp;may&nbsp;be&nbsp;requested&nbsp;at&nbsp;immigration.</p>', 6, '2026-04-27 13:24:58', '2026-05-06 12:27:30'),
(4, '💉 Do I need any vaccines to travel to Kenya?', '<p>Requirements&nbsp;depend&nbsp;on&nbsp;your&nbsp;country&nbsp;of&nbsp;origin.&nbsp;I&nbsp;<strong>strongly&nbsp;recommend</strong>&nbsp;speaking&nbsp;to&nbsp;a&nbsp;travel&nbsp;doctor&nbsp;to&nbsp;get&nbsp;vaccinated&nbsp;based&nbsp;on&nbsp;your&nbsp;country’s&nbsp;recommendations.&nbsp;Based&nbsp;on&nbsp;the&nbsp;internet,&nbsp;routine&nbsp;vaccines&nbsp;(MMR,&nbsp;Tetanus,&nbsp;Influenza),&nbsp;Hepatitis&nbsp;A&nbsp;&amp;&nbsp;B&nbsp;vaccines,&nbsp;Typhoid,&nbsp;and&nbsp;Yellow&nbsp;Fever&nbsp;vaccines&nbsp;are&nbsp;suggested&nbsp;for&nbsp;travel&nbsp;to&nbsp;Kenya.&nbsp;I&nbsp;also&nbsp;got&nbsp;the&nbsp;Traveller&#39;s&nbsp;diarrhea&nbsp;vaccine&nbsp;before&nbsp;going&nbsp;the&nbsp;first&nbsp;time&nbsp;which&nbsp;really&nbsp;helped.&nbsp;</p><p></p><p>If&nbsp;you&nbsp;are&nbsp;planning&nbsp;on&nbsp;visiting&nbsp;rural&nbsp;areas&nbsp;of&nbsp;Kenya,&nbsp;ask&nbsp;your&nbsp;doctor&nbsp;about&nbsp;Malaria&nbsp;prophylaxis&nbsp;as&nbsp;well.&nbsp;</p>', 7, '2026-04-27 13:24:07', '2026-05-06 12:28:55'),
(8, '🎉 What can I do in Nairobi in November?', '<p>November’s&nbsp;mix&nbsp;of&nbsp;sunshine&nbsp;and&nbsp;showers&nbsp;still&nbsp;makes&nbsp;it&nbsp;a&nbsp;great&nbsp;time&nbsp;to&nbsp;explore.&nbsp;Popular&nbsp;options&nbsp;include:</p><ul><li><ul><li><strong>Nairobi&nbsp;National&nbsp;Park</strong>&nbsp;—&nbsp;This&nbsp;national&nbsp;park&nbsp;is&nbsp;right&nbsp;in&nbsp;the&nbsp;city&nbsp;and&nbsp;very&nbsp;accessible&nbsp;to&nbsp;people&nbsp;staying&nbsp;in&nbsp;Nairobi.&nbsp;</li><li><strong>David&nbsp;Sheldrick&nbsp;Wildlife&nbsp;Trust</strong>&nbsp;—&nbsp;Visit&nbsp;baby&nbsp;elephants&nbsp;during&nbsp;their&nbsp;feeding&nbsp;hour.&nbsp;This&nbsp;can&nbsp;be&nbsp;done&nbsp;in&nbsp;combination&nbsp;with&nbsp;the&nbsp;safari&nbsp;at&nbsp;Nairobi&nbsp;National&nbsp;Park.&nbsp;Please&nbsp;note&nbsp;that&nbsp;if&nbsp;you&nbsp;want&nbsp;to&nbsp;do&nbsp;this&nbsp;book&nbsp;three&nbsp;months&nbsp;in&nbsp;advance&nbsp;as&nbsp;slots&nbsp;run&nbsp;out&nbsp;quickly.&nbsp;</li><li><strong>Giraffe&nbsp;Centre</strong>&nbsp;—&nbsp;Feed&nbsp;endangered&nbsp;Rothschild&nbsp;giraffes.&nbsp;These&nbsp;are&nbsp;the&nbsp;same&nbsp;giraffes&nbsp;that&nbsp;go&nbsp;to&nbsp;the&nbsp;Giraffe&nbsp;Manor.&nbsp;</li><li><strong>Karura&nbsp;Forest</strong>&nbsp;—&nbsp;Great&nbsp;for&nbsp;walking&nbsp;and&nbsp;biking;&nbsp;trails&nbsp;are&nbsp;shaded&nbsp;and&nbsp;refreshing&nbsp;after&nbsp;rain</li><li><strong>Maasai&nbsp;Market</strong>&nbsp;—&nbsp;Perfect&nbsp;for&nbsp;handmade&nbsp;crafts&nbsp;and&nbsp;souvenirs.&nbsp;There&nbsp;are&nbsp;several&nbsp;different&nbsp;Maasai&nbsp;Markets&nbsp;in&nbsp;the&nbsp;city.</li><li><strong>Dining&nbsp;</strong>—&nbsp;We&nbsp;recommend&nbsp;sticking&nbsp;to&nbsp;restaurants&nbsp;in&nbsp;Nairobi.&nbsp;There&nbsp;are&nbsp;cheaper,&nbsp;roadside&nbsp;places&nbsp;to&nbsp;eat&nbsp;which&nbsp;may&nbsp;end&nbsp;up&nbsp;being&nbsp;risky.&nbsp;</li></ul></li></ul>', 9, '2026-04-27 13:34:36', '2026-05-06 12:32:22'),
(9, '💳 How do payments work in Nairobi?', '<p>The&nbsp;local&nbsp;currency&nbsp;is&nbsp;the&nbsp;<strong>Kenyan&nbsp;Shilling&nbsp;(KES).</strong>&nbsp;Credit&nbsp;and&nbsp;debit&nbsp;cards&nbsp;are&nbsp;widely&nbsp;accepted&nbsp;in&nbsp;hotels,&nbsp;malls,&nbsp;and&nbsp;restaurants.&nbsp;Kenya’s&nbsp;mobile&nbsp;money&nbsp;system,&nbsp;<strong>M‑Pesa,</strong>&nbsp;is&nbsp;extremely&nbsp;popular&nbsp;too;&nbsp;visitors&nbsp;can&nbsp;use&nbsp;it&nbsp;with&nbsp;a&nbsp;local&nbsp;SIM&nbsp;card.&nbsp;For&nbsp;travellers&nbsp;staying&nbsp;for&nbsp;more&nbsp;than&nbsp;two&nbsp;weeks,&nbsp;I&nbsp;think&nbsp;setting&nbsp;up&nbsp;M-Pesa&nbsp;is&nbsp;worth&nbsp;it.&nbsp;You&nbsp;can&nbsp;use&nbsp;it&nbsp;to&nbsp;pay&nbsp;for&nbsp;everything&nbsp;from&nbsp;souvenirs,&nbsp;to&nbsp;groceries,&nbsp;to&nbsp;Uber.&nbsp;</p><p></p><p>ATMs&nbsp;are&nbsp;reliable&nbsp;in&nbsp;Kenya.&nbsp;I&nbsp;recommend&nbsp;using&nbsp;ATMs&nbsp;from&nbsp;banks&nbsp;rather&nbsp;than&nbsp;third-party&nbsp;ATMs.&nbsp;You&nbsp;should&nbsp;also&nbsp;carry&nbsp;some&nbsp;cash&nbsp;for&nbsp;markets,&nbsp;taxis,&nbsp;and&nbsp;small&nbsp;vendors.&nbsp;</p>', 8, '2026-04-28 13:48:20', '2026-05-05 12:50:24'),
(10, '🧳 Anything else I should know?', '<p>The&nbsp;tap&nbsp;water&nbsp;in&nbsp;Kenya&nbsp;in&nbsp;not&nbsp;safe&nbsp;for&nbsp;consumption.&nbsp;<strong>Make&nbsp;sure&nbsp;to&nbsp;only&nbsp;drink&nbsp;bottled&nbsp;or&nbsp;filtered&nbsp;water.&nbsp;</strong>Ice&nbsp;is&nbsp;safe&nbsp;for&nbsp;consumption&nbsp;in&nbsp;general.&nbsp;</p><p></p><p>Power&nbsp;outlets&nbsp;used&nbsp;are&nbsp;the&nbsp;<strong>Type-G&nbsp;(UK-style&nbsp;plugs)</strong>&nbsp;so&nbsp;make&nbsp;sure&nbsp;to&nbsp;bring&nbsp;an&nbsp;adaptor&nbsp;for&nbsp;North&nbsp;American&nbsp;plugs.&nbsp;</p><p></p><p>Consider&nbsp;purchasing&nbsp;travel&nbsp;and/or&nbsp;medical&nbsp;insurance&nbsp;for&nbsp;your&nbsp;trip.</p>', 11, '2026-04-28 13:53:55', '2026-05-05 12:50:24'),
(11, '🦓 How much is it to go on safari in Kenya?', '<p>Dinah&nbsp;has&nbsp;arranged&nbsp;for&nbsp;a&nbsp;travel&nbsp;package&nbsp;for&nbsp;our&nbsp;friends&nbsp;to&nbsp;go&nbsp;on&nbsp;safari&nbsp;in&nbsp;the&nbsp;Maasai&nbsp;Mara&nbsp;Game&nbsp;Reserve.</p><table style=\"border: 1px solid #000;\"><tbody><tr><td data-row=\"1\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Option</strong></td><td data-row=\"1\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Accomodation</strong></td><td data-row=\"1\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Cost&nbsp;per&nbsp;person&nbsp;(Sharing&nbsp;a&nbsp;double&nbsp;room)</strong></td><td data-row=\"1\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Total&nbsp;cost&nbsp;per&nbsp;couple&nbsp;(2&nbsp;people)</strong></td></tr><tr><td data-row=\"2\">Midrange</td><td data-row=\"2\">Sarova&nbsp;Mara&nbsp;Game&nbsp;Lodge,&nbsp;Kenya</td><td data-row=\"2\">USD$&nbsp;975.00</td><td data-row=\"2\">USD$&nbsp;1950.00</td><td data-row=\"2\"></td></tr><tr><td data-row=\"3\">Budget</td><td data-row=\"3\">Osero&nbsp;Camp,&nbsp;Kenya</td><td data-row=\"3\">USD$&nbsp;835.00</td><td data-row=\"3\">USD$&nbsp;1670.00</td></tr></tbody></table><p></p><p>Both&nbsp;packages&nbsp;include&nbsp;the&nbsp;cost&nbsp;of&nbsp;a&nbsp;double&nbsp;room&nbsp;for&nbsp;2&nbsp;nights&nbsp;(meals&nbsp;are&nbsp;included&nbsp;for&nbsp;your&nbsp;stay),&nbsp;the&nbsp;cost&nbsp;of&nbsp;park&nbsp;fees&nbsp;for&nbsp;2&nbsp;days,&nbsp;the&nbsp;cost&nbsp;of&nbsp;transport&nbsp;(via&nbsp;land&nbsp;cruiser)&nbsp;for&nbsp;2&nbsp;people&nbsp;for&nbsp;the&nbsp;whole&nbsp;safari&nbsp;trip.&nbsp;If&nbsp;you&nbsp;have&nbsp;the&nbsp;budget&nbsp;for&nbsp;it,&nbsp;we&nbsp;recommend&nbsp;going&nbsp;with&nbsp;the&nbsp;midrange&nbsp;budget&nbsp;as&nbsp;it&nbsp;will&nbsp;be&nbsp;a&nbsp;fantastic&nbsp;experience&nbsp;since&nbsp;Sarova&nbsp;Mara&nbsp;is&nbsp;a&nbsp;great&nbsp;hotel.&nbsp;</p><p></p><p>The&nbsp;packages&nbsp;above&nbsp;include:</p><ul><li>Accomodations&nbsp;as&nbsp;mentioned&nbsp;above</li><li>All&nbsp;meals&nbsp;while&nbsp;on&nbsp;safari</li><li>Transport&nbsp;in&nbsp;a&nbsp;safari&nbsp;vehicle&nbsp;with&nbsp;a&nbsp;roof&nbsp;hatch</li><li>All&nbsp;game&nbsp;park&nbsp;entrance&nbsp;fees.</li><li>English-speaking&nbsp;game&nbsp;driver</li><li>Bottled&nbsp;Water</li></ul><p>Not&nbsp;included&nbsp;in&nbsp;the&nbsp;package&nbsp;above:</p><ul><li>Passport&nbsp;and&nbsp;visa&nbsp;fees</li><li>Flight&nbsp;costs&nbsp;and&nbsp;airport&nbsp;taxes</li><li>Accomodation&nbsp;in&nbsp;Nairobi</li><li>Travel&nbsp;and&nbsp;trip&nbsp;insurance</li><li>Personal&nbsp;expenses&nbsp;such&nbsp;as&nbsp;laundary,&nbsp;alcoholic&nbsp;drinks,&nbsp;room&nbsp;service,&nbsp;etc.</li><li>Gratuities&nbsp;for&nbsp;drivers,&nbsp;porters,&nbsp;guides,&nbsp;etc.</li></ul><p></p>', 1, '2026-05-04 13:51:41', '2026-05-05 12:50:24'),
(12, '🗓️ What is the itinerary for the packages above?', '<p><strong><u>Day&nbsp;1&nbsp;–&nbsp;Nairobi&nbsp;–&nbsp;Maasai&nbsp;Mara&nbsp;Game&nbsp;Reserve&nbsp;(5-hour&nbsp;drive)</u></strong></p><p>At&nbsp;around&nbsp;7:00am,&nbsp;you&nbsp;will&nbsp;be&nbsp;picked&nbsp;up&nbsp;by&nbsp;the&nbsp;driver&nbsp;from&nbsp;your&nbsp;hotel/residence&nbsp;in&nbsp;Nairobi&nbsp;and&nbsp;be&nbsp;given&nbsp;a&nbsp;pre-safari&nbsp;briefing,&nbsp;then&nbsp;depart&nbsp;for&nbsp;Maasai&nbsp;Mara&nbsp;Game&nbsp;Reserve&nbsp;with&nbsp;a&nbsp;brief&nbsp;stop&nbsp;at&nbsp;the&nbsp;Great&nbsp;Rift&nbsp;Valley&nbsp;for&nbsp;a&nbsp;scenic&nbsp;view&nbsp;and&nbsp;photography,&nbsp;then&nbsp;proceed&nbsp;to&nbsp;Maasai&nbsp;Mara,&nbsp;where&nbsp;you&nbsp;will&nbsp;arrive&nbsp;in&nbsp;time&nbsp;for&nbsp;lunch.&nbsp;You’ll&nbsp;go&nbsp;on&nbsp;an&nbsp;afternoon&nbsp;game&nbsp;drive&nbsp;(around&nbsp;4:00pm)&nbsp;and&nbsp;return&nbsp;to&nbsp;the&nbsp;lodge&nbsp;for&nbsp;dinner.</p><p>Meals:&nbsp;Lunch&nbsp;and&nbsp;Dinner</p><p></p><p><strong><u>Day&nbsp;2&nbsp;–&nbsp;Maasai&nbsp;Mara&nbsp;Game&nbsp;Reserve&nbsp;(Full&nbsp;day)</u></strong></p><p>Spend&nbsp;the&nbsp;morning&nbsp;and&nbsp;afternoon&nbsp;on&nbsp;two&nbsp;separate&nbsp;game&nbsp;drives&nbsp;to&nbsp;see&nbsp;the&nbsp;animals&nbsp;in&nbsp;Maasai&nbsp;Mara&nbsp;such&nbsp;as&nbsp;lions,&nbsp;zebras,&nbsp;antelopes,&nbsp;buffaloes,&nbsp;wildebeest,&nbsp;giraffes,&nbsp;cheetahs,&nbsp;and&nbsp;hyenas.&nbsp;Alternatively,&nbsp;you&nbsp;can&nbsp;opt&nbsp;for&nbsp;a&nbsp;full&nbsp;day&nbsp;game&nbsp;drive&nbsp;(from&nbsp;8am&nbsp;–&nbsp;4pm)&nbsp;with&nbsp;picnic&nbsp;lunch&nbsp;boxes&nbsp;at&nbsp;a&nbsp;picnic&nbsp;site&nbsp;near&nbsp;Mara&nbsp;River.&nbsp;You’ll&nbsp;return&nbsp;to&nbsp;the&nbsp;lodge&nbsp;for&nbsp;dinner.</p><p>Meals:&nbsp;Breakfast,&nbsp;lunch,&nbsp;and&nbsp;dinner</p><p></p><p><strong><u>Day&nbsp;3&nbsp;–&nbsp;Maasai&nbsp;Mara&nbsp;Game&nbsp;Reserve&nbsp;–&nbsp;Nairobi&nbsp;(5-hour&nbsp;drive)</u></strong></p><p>After&nbsp;breakfast&nbsp;at&nbsp;the&nbsp;hotel,&nbsp;you’ll&nbsp;be&nbsp;driven&nbsp;back&nbsp;to&nbsp;Nairobi,&nbsp;arriving&nbsp;around&nbsp;lunchtime.&nbsp;You&nbsp;will&nbsp;be&nbsp;dropped&nbsp;off&nbsp;at&nbsp;your&nbsp;hotel/residence&nbsp;upon&nbsp;arrival&nbsp;to&nbsp;Nairobi.</p><p>Meals:&nbsp;Breakfast&nbsp;only&nbsp;</p>', 2, '2026-05-04 13:52:10', '2026-05-05 12:50:24'),
(13, '🛖 Is there anything else I can add-on to the package above?', '<p>Yes!&nbsp;If&nbsp;you’re&nbsp;feeling&nbsp;like&nbsp;adding&nbsp;on&nbsp;additional&nbsp;activities&nbsp;beyond&nbsp;the&nbsp;safari&nbsp;trip&nbsp;above,&nbsp;you&nbsp;can&nbsp;also&nbsp;add&nbsp;on&nbsp;the&nbsp;following:</p><p></p><ul><li>Hot&nbsp;air&nbsp;balloon&nbsp;in&nbsp;Maasai&nbsp;Mara&nbsp;Game&nbsp;Reserve&nbsp;–&nbsp;USD$500.00&nbsp;per&nbsp;person</li><li>Cultural&nbsp;visit&nbsp;to&nbsp;Maasai&nbsp;Village&nbsp;–&nbsp;USD$&nbsp;30.00&nbsp;per&nbsp;person.</li></ul><p></p><p>We&nbsp;definitely&nbsp;recommend&nbsp;the&nbsp;visit&nbsp;to&nbsp;the&nbsp;Maasai&nbsp;village.&nbsp;It’s&nbsp;a&nbsp;fantastic&nbsp;experience&nbsp;to&nbsp;see&nbsp;the&nbsp;villager’s&nbsp;traditional&nbsp;way&nbsp;of&nbsp;life.&nbsp;Plus,&nbsp;you&nbsp;get&nbsp;the&nbsp;opportunity&nbsp;to&nbsp;get&nbsp;some&nbsp;unique&nbsp;souvenirs&nbsp;from&nbsp;the&nbsp;Maasai&nbsp;Villagers.&nbsp;We&nbsp;haven’t&nbsp;gone&nbsp;for&nbsp;the&nbsp;hot&nbsp;air&nbsp;balloon&nbsp;but&nbsp;I&nbsp;imagine&nbsp;will&nbsp;be&nbsp;a&nbsp;crazy&nbsp;cool&nbsp;experience.&nbsp;These&nbsp;activities&nbsp;will&nbsp;take&nbsp;place&nbsp;on&nbsp;Day&nbsp;2&nbsp;of&nbsp;the&nbsp;itinerary&nbsp;above.&nbsp;</p>', 3, '2026-05-04 13:52:35', '2026-05-05 12:50:24'),
(14, '1️⃣ What if I’m travelling alone? Am I still able to use the package above?', '<p>We&nbsp;are&nbsp;still&nbsp;trying&nbsp;to&nbsp;figure&nbsp;this&nbsp;out.&nbsp;Please&nbsp;reach&nbsp;out&nbsp;to&nbsp;us&nbsp;if&nbsp;you&nbsp;will&nbsp;be&nbsp;travelling&nbsp;alone.</p>', 4, '2026-05-04 13:52:59', '2026-05-06 12:26:09'),
(15, '✉️ Who do I contact to sign up for the package?', '<p>Please&nbsp;let&nbsp;us&nbsp;know&nbsp;if&nbsp;you&#39;re&nbsp;interested&nbsp;in&nbsp;signing&nbsp;up&nbsp;for&nbsp;a&nbsp;package&nbsp;listed&nbsp;above.&nbsp;We&nbsp;will&nbsp;put&nbsp;you&nbsp;in&nbsp;touch&nbsp;directly&nbsp;with&nbsp;the&nbsp;travel&nbsp;agent.</p>', 5, '2026-05-04 13:53:23', '2026-05-05 12:50:24'),
(17, '🛏️Where am I staying in Nairobi?', '<p>We&nbsp;have&nbsp;negotiated&nbsp;rooms&nbsp;in&nbsp;the&nbsp;Double&nbsp;Tree&nbsp;by&nbsp;Hilton&nbsp;(Ngong&nbsp;road,&nbsp;Nairobi)&nbsp;and&nbsp;in&nbsp;The&nbsp;Curve&nbsp;by&nbsp;the&nbsp;Park&nbsp;(Mombasa&nbsp;Road,&nbsp;Nairobi).&nbsp;The&nbsp;Curve&nbsp;is&nbsp;a&nbsp;serviced&nbsp;apartment&nbsp;(kinda&nbsp;like&nbsp;an&nbsp;AirBNB)&nbsp;with&nbsp;a&nbsp;kitchen&nbsp;and&nbsp;bedroom.&nbsp;It’s&nbsp;got&nbsp;a&nbsp;view&nbsp;of&nbsp;Nairobi&nbsp;National&nbsp;Park&nbsp;so&nbsp;you&nbsp;might&nbsp;be&nbsp;able&nbsp;to&nbsp;see&nbsp;animals&nbsp;from&nbsp;the&nbsp;apartment.&nbsp;Meals&nbsp;are&nbsp;not&nbsp;included&nbsp;here&nbsp;(unlike&nbsp;the&nbsp;Double&nbsp;Tree).&nbsp;The&nbsp;prices&nbsp;would&nbsp;be&nbsp;as&nbsp;per&nbsp;below:</p><table style=\"border: 1px solid #000;\"><tbody><tr><td data-row=\"1\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">The&nbsp;Curve&nbsp;by&nbsp;the&nbsp;Park</strong></td></tr><tr><td data-row=\"2\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Room&nbsp;Type</strong></td><td data-row=\"2\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Price&nbsp;per&nbsp;night&nbsp;($USD)</strong></td></tr><tr><td data-row=\"3\">1&nbsp;bedroom&nbsp;apartment</td><td data-row=\"3\">$64.29</td></tr><tr><td data-row=\"4\">1&nbsp;bedroom&nbsp;apartment&nbsp;with&nbsp;Park&nbsp;View&nbsp;(2&nbsp;adults)</td><td data-row=\"4\">$73</td></tr><tr><td data-row=\"5\">2&nbsp;bedroom&nbsp;apartment&nbsp;with&nbsp;Park&nbsp;View&nbsp;(4&nbsp;adults)</td><td data-row=\"5\">$79.47</td></tr><tr><td data-row=\"6\">Penthouse&nbsp;(4&nbsp;adults)</td><td data-row=\"6\">$111.53</td></tr></tbody></table><p>&nbsp;</p><p>The&nbsp;rooms&nbsp;from&nbsp;the&nbsp;Double&nbsp;Tree&nbsp;by&nbsp;Hilton&nbsp;is&nbsp;half&nbsp;board&nbsp;(include&nbsp;breakfast&nbsp;and&nbsp;dinner).&nbsp;Here’s&nbsp;the&nbsp;prices&nbsp;for&nbsp;Double&nbsp;Tree&nbsp;by&nbsp;Hilton:</p><table style=\"border: 1px solid #000;\"><tbody><tr><td data-row=\"1\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Double&nbsp;Tree&nbsp;by&nbsp;Hilton</strong></td></tr><tr><td data-row=\"2\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Room&nbsp;Type</strong></td><td data-row=\"2\"><strong style=\"background-color: rgb(191, 191, 191); color: black;\">Price&nbsp;per&nbsp;night&nbsp;($USD)</strong></td></tr><tr><td data-row=\"3\">Twin&nbsp;(two&nbsp;twin&nbsp;beds)</td><td data-row=\"3\">$99</td></tr><tr><td data-row=\"4\">King&nbsp;Guest&nbsp;(one&nbsp;king&nbsp;bed)</td><td data-row=\"4\">$99</td></tr><tr><td data-row=\"5\">King&nbsp;Deluxe&nbsp;(bigger&nbsp;room&nbsp;with&nbsp;one&nbsp;king&nbsp;bed)</td><td data-row=\"5\">$133</td></tr></tbody></table><p></p><p>We&nbsp;would&nbsp;be&nbsp;booking&nbsp;these&nbsp;accommodations&nbsp;on&nbsp;your&nbsp;behalf&nbsp;so&nbsp;please&nbsp;let&nbsp;us&nbsp;know&nbsp;if&nbsp;you&nbsp;want&nbsp;to&nbsp;stay&nbsp;in&nbsp;these&nbsp;locations&nbsp;and&nbsp;we&nbsp;can&nbsp;organize&nbsp;that&nbsp;for&nbsp;you.&nbsp;The&nbsp;Curve&nbsp;by&nbsp;the&nbsp;Park&nbsp;is&nbsp;our&nbsp;preferred&nbsp;option&nbsp;and&nbsp;is&nbsp;subject&nbsp;to&nbsp;availability&nbsp;so&nbsp;please&nbsp;make&nbsp;a&nbsp;decision&nbsp;ASAP&nbsp;and&nbsp;let&nbsp;us&nbsp;know.</p>', 0, '2026-05-05 12:50:18', '2026-05-05 12:50:24');

-- --------------------------------------------------------

--
-- Table structure for table `gallery_items`
--

CREATE TABLE `gallery_items` (
  `id` bigint UNSIGNED NOT NULL,
  `image_url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `object_position` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'center',
  `uploaded_by` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_guest_upload` tinyint(1) NOT NULL DEFAULT '0',
  `order` int NOT NULL DEFAULT '0',
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gallery_items`
--

INSERT INTO `gallery_items` (`id`, `image_url`, `caption`, `object_position`, `uploaded_by`, `is_guest_upload`, `order`, `is_visible`, `created_at`, `updated_at`) VALUES
(43, '/uploads/1777244120_eow1BkvXpG.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:21', '2026-04-26 19:55:21'),
(44, '/uploads/1777244123_UyeAjbt6uR.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:23', '2026-04-26 19:55:23'),
(33, '/uploads/1777244039_Z1FGpM8ryB.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:53:59', '2026-04-26 19:53:59'),
(34, '/uploads/1777244049_OSivoojPKq.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:54:09', '2026-04-26 19:54:09'),
(35, '/uploads/1777244049_hZHB6ELeLj.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:54:10', '2026-04-26 19:54:10'),
(36, '/uploads/1777244074_3o1LEv2Ab7.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:54:35', '2026-04-26 19:54:35'),
(37, '/uploads/1777244074_jst9FqiHtK.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:54:35', '2026-04-26 19:54:35'),
(38, '/uploads/1777244076_kuZg2w9xh4.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:54:37', '2026-04-26 19:54:37'),
(41, '/uploads/1777244118_wu6emsob46.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:19', '2026-04-26 19:55:19'),
(40, '/uploads/1777244078_0jOFX5GQjc.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:54:39', '2026-04-26 19:56:49'),
(42, '/uploads/1777244118_4crvJqzLaG.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:19', '2026-04-26 19:55:19'),
(45, '/uploads/1777244122_8j031FlkBw.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:24', '2026-04-26 19:55:24'),
(46, '/uploads/1777244125_4HvW4VLTk3.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:25', '2026-04-26 19:55:25'),
(47, '/uploads/1777244125_TTXEUs3lj1.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:27', '2026-04-26 19:55:27'),
(48, '/uploads/1777244128_nsQ2JleF5J.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:28', '2026-04-26 19:55:28'),
(49, '/uploads/1777244153_gsOpfTHuAv.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:53', '2026-04-26 19:55:53'),
(50, '/uploads/1777244153_dAYuWXmYd8.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:54', '2026-04-26 19:55:54'),
(51, '/uploads/1777244158_5JoNW6ipYA.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:58', '2026-04-26 19:55:58'),
(52, '/uploads/1777244158_TlnHui1uzl.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:55:58', '2026-04-26 19:55:58'),
(53, '/uploads/1777244161_A7ICmAj6zT.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:56:01', '2026-04-26 19:56:01'),
(54, '/uploads/1777244161_Ehz6u3tFZ3.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:56:02', '2026-04-26 19:56:02'),
(55, '/uploads/1777244163_qlvW8op7bK.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:56:04', '2026-04-26 19:56:04'),
(56, '/uploads/1777244164_fy7ySqbkQj.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:56:04', '2026-04-26 19:56:04'),
(57, '/uploads/1777244227_LQSUxhSILK.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:08', '2026-04-26 19:57:08'),
(58, '/uploads/1777244228_bzywGknLgr.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:08', '2026-04-26 19:57:08'),
(59, '/uploads/1777244231_iKMzdgHTCN.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:11', '2026-04-26 19:57:11'),
(60, '/uploads/1777244231_iUmPqTsZo4.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:11', '2026-04-26 19:57:11'),
(61, '/uploads/1777244232_sKe7ju8fWS.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:13', '2026-04-26 19:57:13'),
(62, '/uploads/1777244234_eDEm9cHe1A.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:14', '2026-04-26 19:57:14'),
(63, '/uploads/1777244236_6FhLaIpz9o.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:16', '2026-04-26 19:57:16'),
(64, '/uploads/1777244236_7diXXJ0vqK.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:16', '2026-04-26 19:57:16'),
(65, '/uploads/1777244248_zbwQHpMNq1.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:28', '2026-04-26 19:57:28'),
(66, '/uploads/1777244248_GzXBXzQH0b.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:28', '2026-04-26 19:57:28'),
(67, '/uploads/1777244250_bSd0zVT3mN.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:31', '2026-04-26 19:57:31'),
(68, '/uploads/1777244250_CRBD1FW7QE.jpg', NULL, 'center', NULL, 0, -1, 1, '2026-04-26 19:57:31', '2026-04-26 19:57:31');

-- --------------------------------------------------------

--
-- Table structure for table `gifts`
--

CREATE TABLE `gifts` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `price` decimal(10,2) DEFAULT NULL,
  `image_url` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `is_cash_fund` tinyint(1) NOT NULL DEFAULT '0',
  `product_link` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gifts`
--

INSERT INTO `gifts` (`id`, `name`, `description`, `price`, `image_url`, `category`, `is_cash_fund`, `product_link`, `is_available`, `created_at`, `updated_at`) VALUES
(1, 'Honeymoon Fund', 'Help us create unforgettable memories on our honeymoon adventure!', NULL, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80', 'Experience', 1, NULL, 1, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(2, 'Kitchen Aid Stand Mixer', 'The ultimate kitchen companion for our baking adventures together.', 85000.00, 'https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?auto=format&fit=crop&w=400&q=80', 'Kitchen', 0, NULL, 1, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(3, 'Dining Set for 8', 'Beautiful dining set for hosting family and friends in our new home.', 120000.00, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=400&q=80', 'Home', 0, NULL, 1, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(4, 'Luxury Bedding Set', 'Egyptian cotton sheets and duvet for our bedroom sanctuary.', 45000.00, 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80', 'Bedroom', 0, NULL, 1, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(5, 'Date Night Fund', 'Contribute to our future date nights and romantic dinners.', NULL, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=80', 'Experience', 1, NULL, 1, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(6, 'Coffee Machine', 'For our morning coffee rituals and lazy Sunday mornings.', 65000.00, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&q=80', 'Kitchen', 0, NULL, 1, '2025-12-30 16:24:24', '2025-12-30 16:24:24');

-- --------------------------------------------------------

--
-- Table structure for table `gift_claims`
--

CREATE TABLE `gift_claims` (
  `id` bigint UNSIGNED NOT NULL,
  `gift_id` bigint UNSIGNED NOT NULL,
  `guest_id` bigint UNSIGNED DEFAULT NULL,
  `claimer_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimer_email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_purchased` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `guestbook_entries`
--

CREATE TABLE `guestbook_entries` (
  `id` bigint UNSIGNED NOT NULL,
  `guest_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guestbook_entries`
--

INSERT INTO `guestbook_entries` (`id`, `guest_name`, `message`, `is_approved`, `created_at`, `updated_at`) VALUES
(1, 'KT', 'Can\'t wait to celebrate you guys. Match made in heaven.', 1, '2026-01-20 07:39:46', '2026-01-20 07:39:46');

-- --------------------------------------------------------

--
-- Table structure for table `guests`
--

CREATE TABLE `guests` (
  `id` bigint UNSIGNED NOT NULL,
  `parent_guest_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `save_the_date_method` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `group` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'General',
  `invitation_via` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plus_ones_allowed` int NOT NULL DEFAULT '0',
  `unique_code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `rsvp_status` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `rsvp_message` text COLLATE utf8mb4_unicode_ci,
  `dietary_notes` text COLLATE utf8mb4_unicode_ci,
  `song_request` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_code` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checked_in_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `table_id` bigint UNSIGNED DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `guests`
--

INSERT INTO `guests` (`id`, `parent_guest_id`, `name`, `email`, `save_the_date_method`, `phone`, `group`, `invitation_via`, `plus_ones_allowed`, `unique_code`, `rsvp_status`, `rsvp_message`, `dietary_notes`, `song_request`, `qr_code`, `checked_in_at`, `created_at`, `updated_at`, `table_id`) VALUES
(44, 7, 'Ann Kairu', 'kairuannw@gmail.com', NULL, '+254717215425', 'family', 'email', 0, 'HMMHKXQR', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-04-02 09:38:16', '2026-05-07 04:13:05', NULL),
(7, NULL, 'Kevin Tambo', 'juniortambo2628@gmail.com', NULL, '0705883227', 'family', 'email', 1, 'LO2J85UX', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-03-11 17:40:12', '2026-05-07 04:13:04', 1),
(9, NULL, 'Hong Cho Tzen', 'chotzen92@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '4WEEAXME', 'confirmed', 'Happy to be joining you two on your special day!', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-06 21:42:44', NULL),
(10, NULL, 'Abigail Jinggut', 'a.jinggut@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'BWNRJXND', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-07 20:12:02', NULL),
(11, NULL, 'Tang Tze Lee', 'tangtzelee@yahoo.com', 'E-mail', NULL, 'Invited', NULL, 0, '8Y4ALR6L', 'pending', 'LOL', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-05 13:55:04', NULL),
(12, NULL, 'Miqdaad Fatakdawala', 'miqdaad.fatakdawala@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '1WN5QZJD', 'confirmed', 'Love you guys!!!!!! Excited :)', 'None', NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-06 16:07:08', NULL),
(13, NULL, 'Nabeela Merchant', 'nabeelamerchant@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'RZQ5FF9I', 'confirmed', 'I\'m so excited to share this special day with both of you. Congrats and all the best for the journey ahead.', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-18 23:05:41', NULL),
(14, NULL, 'Mukund Kumar', 'kmukund1992@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'QR8ALW5M', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-05 13:55:04', NULL),
(15, NULL, 'Jasmine Khurana', 'jasminee.khurana@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'VGYQZJQ1', 'confirmed', 'Love you guys and can’t wait to celebrate with you both ♥️', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-26 10:02:20', NULL),
(16, NULL, 'Arash Oturkar', 'arash.oturkar@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '8DKUMPPS', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-07 13:45:30', NULL),
(17, NULL, 'Nilesh Pandey', 'nlhpandey@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'WRV8RMNA', 'confirmed', 'Both of you are such amazing human beings - I am truly honoured and blessed to call both of you my friend. I wish you both the best wedding and times ahead :)', 'None', NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-06-02 11:32:43', NULL),
(18, NULL, 'Eric Dyer', 'dyereh@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'W2SAE76Z', 'confirmed', 'Can\'t wait guizzz - its gonna be so epic!', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-28 12:23:20', NULL),
(19, NULL, 'Chelsea Urquico', 'ceurquico@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'MH6QQQ0O', 'confirmed', 'Eric & I are so excited to celebrate you guys in Kenya, it\'s gonna be so beautiful & fun!!! thank you for inviting us, let\'s have dinner together again soon!!!', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-14 17:12:31', NULL),
(20, NULL, 'Bhavesh Kakwani', 'bk@bhave.sh', 'E-mail', NULL, 'Invited', NULL, 0, '9PSM7NAA', 'confirmed', 'I am so friggity giggity for you two! 😘 😘 Let’s have a lovely celebration together', 'Lactose intolerant', NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-14 20:39:10', NULL),
(21, NULL, 'Natalie Ploccienik', 'natalie.plociennik@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '2EQJADOI', 'confirmed', 'We’re excited to celebrate this incredibly special day with you both abroad! I can’t wait for the adventures and the life ahead. Love you both and looking forward to the witnessing and unfolding of all that is to come. May you have the best experience in Kenya and the best lives together forever ❤️❤️❤️', 'None!', NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-26 15:14:32', NULL),
(22, NULL, 'Marc Reeve-Newson', 'marc.reevenewson@gmail.com', 'E-mail', NULL, 'Invited', 'whatsapp', 0, 'C4AIG96G', 'confirmed', 'Looking forward to it. (And it\'s Reeve-Newson, not Reeves-Newson!)', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-26 14:03:54', NULL),
(23, NULL, 'Jasper Johar', 'jasperjohar28@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '0OBUN63A', 'confirmed', 'Lets make it happennnnn', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-07 13:24:57', NULL),
(24, NULL, 'Muskan Jaswal', 'muskanjaswal67@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'IWSG6C9U', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-05 13:55:04', NULL),
(25, NULL, 'Senthuren Jeganathan', 'senthuren.jegan@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'Q9WOGJGB', 'declined', 'We are so excited for this next chapter of your lives. I’m so sorry that we are unable to join but excited for all the local events and celebrating once you guys are back. Lots of love, \nSen, Lax & Vignesh', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-06-14 09:32:51', NULL),
(26, NULL, 'Laxsanaa Siva', 'laxsanaa.siva@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'GTSTJGFW', 'declined', 'What a great experience it would have been to see you both get married in a beautiful country I have only dreamt of visiting! I am so sad I cannot be there and celebrate you both for reasons beyond my control but I wish you both nothing but the best as you start this roller coaster of a next chapter in all the best ways! Love you both! ♥️', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-06-14 10:53:20', NULL),
(27, NULL, 'Jeff Adam Richard Emmanuel', 'jeffaremmanuel@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'BGUPXLNU', 'confirmed', 'Love you guys and thank you for the details, its very helpful for planning, particularly the FAQ section. We will discuss and get back to you shortly on any requests when we have set dates.', 'No', NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-07 13:54:38', NULL),
(28, NULL, 'Elisa Jean', 'jean.elisa.ej@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '3NULWKLR', 'confirmed', NULL, 'N/A', NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-27 13:19:05', NULL),
(29, NULL, 'Yasmeen Mansoor', 'mnsr.yasmeen@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'VMVWO7Q0', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-05 13:55:04', NULL),
(30, NULL, 'Petra Ojinnaka', 'petraojinnaka@gmail.com', 'E-mail', NULL, 'Invited', 'whatsapp', 0, 'ILPPFOHH', 'confirmed', 'My dear Dinah & TR, I’m so excited to celebrate your love and special day with you both. It has been such a beautiful thing watching your relationship blossom from the beginning to where it is now, and I’m truly so happy for you both. Really looking forward to celebrating with you ❤️', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-24 22:44:13', NULL),
(31, NULL, 'Ifechukwude Obiago', 'iffieobiago@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'QYQQYZIC', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-18 01:24:28', NULL),
(32, NULL, 'Namrata Bhagia', 'n.bhagia@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'W9KBGF1K', 'confirmed', 'Can’t wait to celebrate my fellow SLIders! Lysm.', NULL, NULL, NULL, NULL, '2026-03-31 18:25:11', '2026-05-23 12:52:02', NULL),
(33, NULL, 'Ankita Puri', 'ankitapuri189@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'SMGJQVEE', 'confirmed', 'Looking forward to the wedding of the year! 3 weddings, 3 locations, but I know you will dance around the world anyway.', 'N/A', NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-22 17:42:10', NULL),
(34, NULL, 'Toritseyemi Ugbeye', 'oyemiugbeye@gmail.com', 'E-mail', NULL, 'Invited', 'whatsapp', 0, 'OY4COPBB', 'confirmed', 'D and TR, My heart is full seeing you guys take this next BIG step. It’s going to be amazing. Looking forward to more restaurant hopping and good vibes in the years to come. Love you both❤️', 'None to report atm 😁', NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-06-23 13:23:00', NULL),
(35, NULL, 'Jaanam Mahboobani', 'jaanam3@icloud.com', NULL, NULL, 'Invited', NULL, 0, 'TZFR09YN', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-17 17:02:21', NULL),
(36, NULL, 'Dil Sodhi', 'mrdilsodhi@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, '90USPQY3', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-05 13:55:04', NULL),
(37, NULL, 'Sorenia Chatzialexiou', 'sorenia@mac.com', 'E-mail', NULL, 'Invited', NULL, 0, '0FVKZLGF', 'declined', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-27 18:57:11', NULL),
(38, NULL, 'Agbolade Adeyemi', 'agboladea@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'IWG5SJ0H', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-05 13:55:04', NULL),
(39, NULL, 'Alex Guerrero', 'alexpguerrero@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'IQ7LDEV8', 'declined', 'Love you both. Really wish I could be there and be a part of the ceremony but can’t wait to celebrate with you back in TO 😘', NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-06-11 16:37:39', NULL),
(40, NULL, 'Benita Foo', 'benita.foo@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'NKA51GDV', 'confirmed', 'Can\'t wait to celebrate with the both of you!', NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-23 16:02:49', NULL),
(41, NULL, 'Brandon Fitzgerald', 'brandonrfitzgerald@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'WSGLLPK6', 'confirmed', 'Super excited to join you guys in Kenya for your big day!! Congratulations!!!', NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-23 16:51:27', NULL),
(42, NULL, 'Diane Kim', 'dianekim91@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'SLZCLU4N', 'confirmed', 'Can’t wait!!', NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-26 22:33:41', NULL),
(43, NULL, 'Francis Premont', 'premontfra@gmail.com', 'E-mail', NULL, 'Invited', NULL, 0, 'XSAJMUYA', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-03-31 18:25:12', '2026-05-14 09:30:08', NULL),
(45, NULL, 'Tze Ren Tang', 'tangtzeren@gmail.com', NULL, '1-905-531-2912', 'family', NULL, 0, 'RBJ5TZOY', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-04-26 15:58:51', '2026-05-21 21:09:04', NULL),
(48, NULL, 'Gabi Steglinski', 'gabi.steglinski@hotmail.com', NULL, '+16473854443', 'family', 'whatsapp', 0, 'IJQTLEOR', 'declined', 'Incredibly sad we won’t be celebrating your big day in Nairobi, but hope for the chance to do it on Canadian soil! Congratulations you beautiful couple x', NULL, NULL, NULL, NULL, '2026-05-05 13:54:46', '2026-06-12 22:14:56', NULL),
(49, NULL, 'Kevin Omondi Junior', 'kevinjtambo@gmail.com', NULL, '+254705788933', 'family', 'email', 0, 'E7V6LFC7', 'confirmed', NULL, NULL, NULL, NULL, NULL, '2026-05-07 10:04:03', '2026-05-07 10:48:09', NULL),
(50, NULL, 'Donghai Wu', 'wudh308@outlook.com', NULL, NULL, 'friends', 'email', 0, 'KDQUJB8S', 'declined', NULL, NULL, NULL, NULL, NULL, '2026-05-17 22:22:35', '2026-05-23 12:11:07', NULL),
(51, NULL, 'Neville Ondenge', 'nevilleondenge@live.ca', NULL, NULL, 'family', 'email', 0, '81UM262S', 'confirmed', 'Congratulations Dinah and Ren for reaching this milestone in your lives. I look forward to seeing you at your wedding and may your marriage bring you infinite joy and abundant blessings.', NULL, NULL, NULL, NULL, '2026-05-21 22:46:19', '2026-06-06 15:01:36', NULL),
(52, NULL, 'Linda', 'munezeli@outlook.com', NULL, NULL, 'family', 'whatsapp', 0, '417EL2KA', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-21 22:53:01', '2026-05-21 22:53:01', NULL),
(53, NULL, 'Felicia Thomas', 'feliciakavitathomas@gmail.com', NULL, NULL, 'friends', 'email', 0, 'L5PPFLLK', 'declined', 'Heartiest congratulations to you both, Tze Ren & Dinah 🥰 \nSo happy for you both! May your marriage be filled with happiness, laughter, and unforgettable moments~', NULL, NULL, NULL, NULL, '2026-05-23 01:21:23', '2026-05-26 09:28:21', NULL),
(54, NULL, 'Chow Mee Chin', 'meechinchow@gmail.com', NULL, '+61433292353', 'friends', 'email', 0, '8CVJWSCA', 'confirmed', 'Happiness & Joy always in the new life together.', 'Small portion pls', NULL, NULL, NULL, '2026-05-24 22:40:08', '2026-05-26 08:35:49', NULL),
(55, NULL, 'Hew Cheng Sim', 'cshew57@gmail.com', NULL, '+60168865756', 'family', 'whatsapp', 0, '7YD2ESA4', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-24 22:41:29', '2026-05-24 22:41:29', NULL),
(56, NULL, 'Tang Tieng Swee', 'tangtiengswee@gmail.com', NULL, '+60138118929', 'family', 'whatsapp', 0, '2MCQJ0TJ', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-05-24 22:41:59', '2026-05-24 22:41:59', NULL),
(57, NULL, 'Choong Xin Yi', 'xinyi22@gmail.com', NULL, NULL, 'family', 'email', 0, 'V7GVCCXV', 'pending', NULL, NULL, NULL, NULL, NULL, '2026-06-08 11:46:26', '2026-06-08 11:46:26', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invitations`
--

CREATE TABLE `invitations` (
  `id` bigint UNSIGNED NOT NULL,
  `guest_id` bigint UNSIGNED NOT NULL,
  `status` enum('pending','sent','opened','responded') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `sent_at` timestamp NULL DEFAULT NULL,
  `opened_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invitations`
--

INSERT INTO `invitations` (`id`, `guest_id`, `status`, `sent_at`, `opened_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'opened', NULL, '2026-01-20 07:46:48', '2025-12-30 16:24:24', '2026-01-20 07:46:48'),
(2, 2, 'pending', NULL, NULL, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(3, 3, 'pending', NULL, NULL, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(4, 4, 'pending', NULL, NULL, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(5, 5, 'pending', NULL, NULL, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(6, 6, 'pending', NULL, NULL, '2025-12-30 16:24:24', '2025-12-30 16:24:24'),
(7, 7, 'opened', '2026-05-07 04:12:14', '2026-05-07 10:42:16', '2026-03-11 17:40:12', '2026-05-07 10:42:16'),
(8, 8, 'opened', NULL, '2026-03-31 20:18:34', '2026-03-11 17:40:12', '2026-03-31 20:18:34'),
(9, 9, 'opened', '2026-05-06 15:55:57', '2026-05-21 11:42:55', '2026-03-31 18:25:11', '2026-05-21 11:42:55'),
(10, 10, 'opened', '2026-05-06 15:56:03', '2026-05-07 20:13:02', '2026-03-31 18:25:11', '2026-05-07 20:13:02'),
(11, 11, 'sent', '2026-05-06 15:56:10', '2026-04-27 23:23:35', '2026-03-31 18:25:11', '2026-05-06 15:56:10'),
(12, 12, 'responded', '2026-05-06 15:56:16', '2026-05-06 16:05:34', '2026-03-31 18:25:11', '2026-05-06 16:07:08'),
(13, 13, 'responded', '2026-05-06 15:56:22', '2026-05-18 21:51:55', '2026-03-31 18:25:11', '2026-05-18 23:05:41'),
(14, 14, 'opened', '2026-05-06 15:56:28', '2026-05-06 15:58:03', '2026-03-31 18:25:11', '2026-05-06 15:58:03'),
(15, 15, 'responded', '2026-05-06 15:56:34', '2026-05-26 09:59:51', '2026-03-31 18:25:11', '2026-05-26 10:02:20'),
(16, 16, 'responded', '2026-05-06 15:56:39', '2026-05-07 13:45:19', '2026-03-31 18:25:11', '2026-05-07 13:45:30'),
(17, 17, 'responded', '2026-05-26 11:12:16', '2026-06-02 11:25:12', '2026-03-31 18:25:11', '2026-06-02 11:32:43'),
(18, 18, 'responded', '2026-05-06 15:54:42', '2026-05-28 12:15:50', '2026-03-31 18:25:11', '2026-05-28 12:23:20'),
(19, 19, 'responded', '2026-05-06 15:54:48', '2026-05-14 17:10:03', '2026-03-31 18:25:11', '2026-05-14 17:12:31'),
(20, 20, 'opened', '2026-05-06 15:54:54', '2026-05-25 19:37:37', '2026-03-31 18:25:11', '2026-05-25 19:37:37'),
(21, 21, 'responded', '2026-05-06 15:54:59', '2026-05-26 15:05:43', '2026-03-31 18:25:11', '2026-05-26 15:14:32'),
(22, 22, 'responded', '2026-05-06 15:55:05', '2026-05-24 22:58:20', '2026-03-31 18:25:11', '2026-05-24 22:59:33'),
(23, 23, 'responded', '2026-05-06 15:55:11', '2026-05-07 13:24:35', '2026-03-31 18:25:11', '2026-05-07 13:24:57'),
(24, 24, 'sent', '2026-05-06 15:55:16', NULL, '2026-03-31 18:25:11', '2026-05-06 15:55:16'),
(25, 25, 'opened', '2026-05-06 15:54:32', '2026-06-14 15:59:54', '2026-03-31 18:25:11', '2026-06-14 15:59:54'),
(26, 26, 'responded', '2026-05-06 15:54:26', '2026-06-14 10:49:46', '2026-03-31 18:25:11', '2026-06-14 10:53:20'),
(27, 27, 'responded', '2026-05-06 15:55:21', '2026-05-07 13:53:16', '2026-03-31 18:25:11', '2026-05-07 13:54:38'),
(28, 28, 'opened', '2026-05-06 15:54:21', '2026-05-27 23:50:03', '2026-03-31 18:25:11', '2026-05-27 23:50:03'),
(29, 29, 'opened', '2026-05-06 15:54:15', '2026-05-13 15:12:43', '2026-03-31 18:25:11', '2026-05-13 15:12:43'),
(30, 30, 'opened', '2026-05-06 15:54:10', '2026-06-14 13:34:18', '2026-03-31 18:25:11', '2026-06-14 13:34:18'),
(31, 31, 'responded', '2026-05-06 15:54:05', '2026-05-18 01:21:45', '2026-03-31 18:25:11', '2026-05-18 01:24:28'),
(32, 32, 'responded', '2026-05-06 15:52:34', '2026-05-23 12:51:16', '2026-03-31 18:25:12', '2026-05-23 12:52:02'),
(33, 33, 'responded', '2026-05-06 15:51:41', '2026-05-22 17:31:33', '2026-03-31 18:25:12', '2026-05-22 17:42:10'),
(34, 34, 'opened', '2026-05-07 12:22:58', '2026-05-07 19:13:04', '2026-03-31 18:25:12', '2026-05-07 19:13:04'),
(35, 35, 'responded', '2026-05-06 15:51:50', '2026-05-17 17:02:09', '2026-03-31 18:25:12', '2026-05-17 17:02:21'),
(36, 36, 'sent', '2026-05-06 15:51:56', NULL, '2026-03-31 18:25:12', '2026-05-06 15:51:56'),
(37, 37, 'responded', '2026-05-06 15:52:01', '2026-05-27 18:57:04', '2026-03-31 18:25:12', '2026-05-27 18:57:11'),
(38, 38, 'sent', '2026-05-13 14:49:56', NULL, '2026-03-31 18:25:12', '2026-05-13 14:49:56'),
(39, 39, 'responded', '2026-05-06 15:52:12', '2026-06-11 16:36:27', '2026-03-31 18:25:12', '2026-06-11 16:37:39'),
(40, 40, 'opened', '2026-05-06 15:52:17', '2026-05-23 16:17:24', '2026-03-31 18:25:12', '2026-05-23 16:17:24'),
(41, 41, 'responded', '2026-05-06 15:52:23', '2026-05-23 16:44:02', '2026-03-31 18:25:12', '2026-05-23 16:51:27'),
(42, 42, 'opened', '2026-05-06 15:51:35', '2026-06-05 11:48:05', '2026-03-31 18:25:12', '2026-06-05 11:48:05'),
(43, 43, 'opened', '2026-05-06 15:52:28', '2026-05-14 09:40:02', '2026-03-31 18:25:12', '2026-05-14 09:40:02'),
(44, 44, 'responded', '2026-05-07 04:12:16', '2026-05-04 08:30:39', '2026-04-02 09:38:16', '2026-05-07 04:13:05'),
(45, 45, 'opened', '2026-05-24 22:40:21', '2026-05-24 22:40:50', '2026-04-26 15:58:51', '2026-05-24 22:40:50'),
(46, 46, 'pending', NULL, NULL, '2026-04-29 17:32:50', '2026-04-29 17:32:50'),
(47, 47, 'pending', NULL, NULL, '2026-04-30 15:26:48', '2026-04-30 15:26:48'),
(48, 48, 'responded', '2026-05-06 15:51:18', '2026-06-12 22:13:15', '2026-05-05 13:54:46', '2026-06-12 22:14:56'),
(49, 49, 'responded', '2026-05-07 10:46:11', '2026-05-07 10:46:40', '2026-05-07 10:04:03', '2026-05-07 10:48:09'),
(50, 50, 'responded', '2026-05-17 22:23:09', '2026-05-23 12:10:47', '2026-05-17 22:22:35', '2026-05-23 12:11:07'),
(51, 51, 'responded', '2026-05-21 22:55:56', '2026-06-06 14:56:44', '2026-05-21 22:46:19', '2026-06-06 15:01:36'),
(52, 52, 'sent', '2026-05-21 22:55:51', NULL, '2026-05-21 22:53:01', '2026-05-21 22:55:51'),
(53, 53, 'opened', '2026-05-23 01:21:56', '2026-05-26 12:52:06', '2026-05-23 01:21:23', '2026-05-26 12:52:06'),
(54, 54, 'responded', '2026-05-24 22:42:15', '2026-05-26 08:34:18', '2026-05-24 22:40:08', '2026-05-26 08:35:49'),
(55, 55, 'opened', '2026-05-24 22:44:46', '2026-05-24 22:49:25', '2026-05-24 22:41:29', '2026-05-24 22:49:25'),
(56, 56, 'sent', '2026-05-24 22:44:40', NULL, '2026-05-24 22:41:59', '2026-05-24 22:44:40'),
(57, 57, 'sent', '2026-06-08 11:46:42', NULL, '2026-06-08 11:46:26', '2026-06-08 11:46:42');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `live_updates`
--

CREATE TABLE `live_updates` (
  `id` bigint UNSIGNED NOT NULL,
  `schedule_item_id` bigint UNSIGNED DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('normal','important','alert') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_12_11_055128_create_personal_access_tokens_table', 1),
(5, '2025_12_11_055129_create_permission_tables', 1),
(6, '2025_12_11_100001_create_guests_table', 1),
(7, '2025_12_11_100002_create_rsvp_responses_table', 1),
(8, '2025_12_11_100003_create_invitations_table', 1),
(9, '2025_12_11_100004_create_events_table', 1),
(10, '2025_12_11_100005_create_schedule_items_table', 1),
(11, '2025_12_11_100006_create_live_updates_table', 1),
(12, '2025_12_11_100007_create_gifts_table', 1),
(13, '2025_12_11_100008_create_gift_claims_table', 1),
(14, '2025_12_11_141447_create_settings_table', 1),
(15, '2025_12_11_144648_create_tables_table', 1),
(16, '2025_12_11_144726_add_table_id_to_guests_table', 1),
(17, '2025_12_11_154456_create_gallery_items_table', 1),
(18, '2025_12_11_154456_create_page_contents_table', 1),
(19, '2025_12_12_000001_add_object_position_to_gallery_items', 1),
(20, '2025_12_12_000002_add_song_qr_checkin_to_guests', 1),
(21, '2025_12_12_000003_create_song_requests_table', 1),
(22, '2025_12_12_000004_create_guestbook_entries_table', 1),
(23, '2025_12_12_000005_add_guest_upload_to_gallery_items', 1),
(24, '2025_12_12_022318_create_notifications_table', 1),
(25, '2025_12_15_112459_add_product_link_to_gifts_table', 1),
(26, '2025_12_29_000000_seed_rsvp_content', 1),
(27, '2025_12_29_000001_add_parent_guest_id_to_guests', 1),
(28, '2026_01_29_122742_create_polaroid_images_table', 2),
(29, '2026_01_29_124335_add_details_to_polaroid_images_table', 3),
(30, '2026_01_29_134138_add_location_to_polaroid_images_table', 4),
(31, '2026_02_09_073648_add_two_factor_columns_to_users_table', 5),
(32, '2026_03_11_205859_create_faqs_table', 6),
(33, '2026_03_24_210923_add_rsvp_status_and_plus_ones_to_guests_table', 7),
(34, '2026_03_24_211545_rename_plus_ones_column_on_guests_table', 8),
(35, '2026_03_31_192428_add_save_the_date_method_to_guests', 9),
(36, '2026_03_31_225051_add_invitation_via_to_guests_table', 10),
(37, '2026_04_29_180931_create_enquiries_table', 11),
(38, '2026_04_29_184011_add_type_to_enquiries_table', 11),
(39, '2026_04_30_005843_unify_guest_rsvp_data', 12);

-- --------------------------------------------------------

--
-- Table structure for table `model_has_permissions`
--

CREATE TABLE `model_has_permissions` (
  `permission_id` bigint UNSIGNED NOT NULL,
  `model_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `model_has_roles`
--

CREATE TABLE `model_has_roles` (
  `role_id` bigint UNSIGNED NOT NULL,
  `model_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `model_id` bigint UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `notifiable_id` bigint UNSIGNED NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `notifiable_type`, `notifiable_id`, `data`, `read_at`, `created_at`, `updated_at`) VALUES
('e805cf0f-0bf4-4d7d-aaad-dac8c1ed2b95', 'GuestRSVP', 'App\\Models\\User', 1, '{\"title\":\"New RSVP Submission\",\"message\":\"Ann Wanja Kairu has confirmed attendance\",\"icon\":\"user\"}', '2026-04-23 10:42:49', '2026-03-12 04:12:23', '2026-04-23 10:42:49'),
('d4920683-1a81-4de4-8fd4-f3e8373d4642', 'GuestRSVP', 'App\\Models\\User', 1, '{\"title\":\"New RSVP Submission\",\"message\":\"Ann Wanja Kairu has confirmed attendance\",\"icon\":\"user\"}', '2026-04-23 10:42:49', '2026-03-12 04:45:14', '2026-04-23 10:42:49'),
('053f7387-d47d-4471-bcb5-831946be6c93', 'GuestRSVP', 'App\\Models\\User', 1, '{\"title\":\"New RSVP Submission\",\"message\":\"Ann Wanja Kairu has confirmed attendance\",\"icon\":\"user\"}', '2026-04-23 10:42:49', '2026-03-12 04:53:38', '2026-04-23 10:42:49'),
('952c2d67-6860-4b03-9f75-15f819286a91', 'GuestRSVP', 'App\\Models\\User', 1, '{\"title\":\"New RSVP Submission\",\"message\":\"Ann Wanja Kairu has confirmed attendance\",\"icon\":\"user\"}', '2026-04-23 10:42:49', '2026-03-12 05:01:57', '2026-04-23 10:42:49'),
('2faedbb0-74b8-41a4-8449-41e21004a92c', 'GuestRSVP', 'App\\Models\\User', 1, '{\"title\":\"New RSVP Submission\",\"message\":\"Kevin Tambo has confirmed attendance\",\"icon\":\"user\"}', '2026-04-23 10:42:49', '2026-03-12 15:25:14', '2026-04-23 10:42:49'),
('a4777913-2302-43d2-94b0-f6c8478d3ded', 'SongRequested', 'App\\Models\\User', 1, '{\"title\":\"New Song Request\",\"message\":\"Kevin Tambo requested \'Low Life (feat. The Weeknd)\'\",\"icon\":\"music\"}', '2026-04-23 10:42:49', '2026-04-01 19:18:55', '2026-04-23 10:42:49'),
('4927be3d-8092-471f-bb47-c194220c6afd', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Tze Ren Tang\",\"message\":\"Tze Ren Tang has confirmed their attendance.\",\"guest_id\":45,\"attending\":true,\"plus_ones\":0}', NULL, '2026-04-30 13:54:40', '2026-04-30 13:54:40'),
('3feb4156-e8db-436a-892d-71782beba253', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Kevin Tambo\",\"message\":\"Kevin Tambo has confirmed their attendance.\",\"guest_id\":7,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-03 05:31:44', '2026-05-03 05:31:44'),
('406e436c-8529-41fa-9228-bc6364e8396d', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Tze Ren Tang\",\"message\":\"Tze Ren Tang has confirmed their attendance.\",\"guest_id\":45,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-05 13:34:17', '2026-05-05 13:34:17'),
('c8147666-003a-422a-940c-dc471e86f9b7', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Tze Ren Tang\",\"message\":\"Tze Ren Tang has confirmed their attendance.\",\"guest_id\":45,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-06 14:18:48', '2026-05-06 14:18:48'),
('e1e7dc9f-2763-46b7-aed0-fc8384f40128', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Jasper Johar\",\"message\":\"Jasper Johar has respectfully declined.\",\"guest_id\":23,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-06 16:01:27', '2026-05-06 16:01:27'),
('76823dd1-f528-4be1-903d-7ba805623f7b', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Miqdaad Fatakdawala\",\"message\":\"Miqdaad Fatakdawala has confirmed their attendance.\",\"guest_id\":12,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-06 16:07:11', '2026-05-06 16:07:11'),
('53aa4a9c-9fa3-4b64-9b58-35fc3dd9a3ce', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Hong Cho Tzen\",\"message\":\"Hong Cho Tzen has confirmed their attendance.\",\"guest_id\":9,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-06 21:42:46', '2026-05-06 21:42:46'),
('2b663826-4134-459d-88ac-abcbc0f57af4', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Toristyemi Ugbeye\",\"message\":\"Toristyemi Ugbeye has respectfully declined.\",\"guest_id\":34,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-06 21:55:57', '2026-05-06 21:55:57'),
('9caae21c-e48f-462b-bf35-a334383622a7', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Arash Oturkar\",\"message\":\"Arash Oturkar has respectfully declined.\",\"guest_id\":16,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-06 22:09:51', '2026-05-06 22:09:51'),
('1f29deff-de87-4736-98b8-9b5b979c6d92', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Kevin Tambo\",\"message\":\"Kevin Tambo has respectfully declined.\",\"guest_id\":7,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-07 02:54:05', '2026-05-07 02:54:05'),
('d38569ed-522e-4058-8d1f-7129d4019a33', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Kevin Tambo\",\"message\":\"Kevin Tambo has confirmed their attendance.\",\"guest_id\":7,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 04:13:07', '2026-05-07 04:13:07'),
('a6e483c5-043e-421f-a5ec-efafbefbdbbc', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Kevin Omondi Junior\",\"message\":\"Kevin Omondi Junior has respectfully declined.\",\"guest_id\":49,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-07 10:05:47', '2026-05-07 10:05:47'),
('663654a0-c7db-4878-ac19-45d7f17d0a13', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Kevin Omondi Junior\",\"message\":\"Kevin Omondi Junior has confirmed their attendance.\",\"guest_id\":49,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 10:48:12', '2026-05-07 10:48:12'),
('ffdd348c-a992-403b-94ac-4bfdb9ce9e44', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Toristyemi Ugbeye\",\"message\":\"Toristyemi Ugbeye has confirmed their attendance.\",\"guest_id\":34,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 12:26:42', '2026-05-07 12:26:42'),
('410bdc1c-e5e3-46ee-8fc1-3a233f791031', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Jasper Johar\",\"message\":\"Jasper Johar has confirmed their attendance.\",\"guest_id\":23,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 13:25:00', '2026-05-07 13:25:00'),
('b2082e85-186c-4e7c-9071-75c953e3c5a1', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Arash Oturkar\",\"message\":\"Arash Oturkar has confirmed their attendance.\",\"guest_id\":16,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 13:45:33', '2026-05-07 13:45:33'),
('98a0414b-c121-4f7e-a1df-7fd096866403', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Jeff Adam Richard Emmanuel\",\"message\":\"Jeff Adam Richard Emmanuel has confirmed their attendance.\",\"guest_id\":27,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 13:54:40', '2026-05-07 13:54:40'),
('cd37e94f-5e57-46b9-825b-99a47b6ec87e', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Sorenia Chatzialexiou\",\"message\":\"Sorenia Chatzialexiou has confirmed their attendance.\",\"guest_id\":37,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 14:42:46', '2026-05-07 14:42:46'),
('3946277d-546c-4019-8043-d7369c1fe885', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Abigail Jinggut\",\"message\":\"Abigail Jinggut has confirmed their attendance.\",\"guest_id\":10,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-07 20:12:05', '2026-05-07 20:12:05'),
('451fee7c-f46f-4657-aea8-460b961e9766', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Francis Premont\",\"message\":\"Francis Premont has confirmed their attendance.\",\"guest_id\":43,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-14 09:30:11', '2026-05-14 09:30:11'),
('d32122ba-3764-4f4c-ba22-7508a0ea501f', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Chelsea Urquico\",\"message\":\"Chelsea Urquico has confirmed their attendance.\",\"guest_id\":19,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-14 17:12:33', '2026-05-14 17:12:33'),
('ed9bd922-10f6-4c27-8e67-b344d1e51d3d', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Bhavesh Kakwani\",\"message\":\"Bhavesh Kakwani has confirmed their attendance.\",\"guest_id\":20,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-14 20:39:13', '2026-05-14 20:39:13'),
('8fa9fdb9-38c7-4b7e-8366-2ac31783adf6', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Jaanam Mahboobani\",\"message\":\"Jaanam Mahboobani has confirmed their attendance.\",\"guest_id\":35,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-17 17:02:23', '2026-05-17 17:02:23'),
('6376dbcd-0f91-4298-9836-719f22d14002', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Ifechukwude Obiago\",\"message\":\"Ifechukwude Obiago has confirmed their attendance.\",\"guest_id\":31,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-18 01:24:30', '2026-05-18 01:24:30'),
('05e1fdc2-965c-4bf0-bb97-67a890a8517e', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Nabeela Merchant\",\"message\":\"Nabeela Merchant has confirmed their attendance.\",\"guest_id\":13,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-18 23:05:45', '2026-05-18 23:05:45'),
('d5e5b963-0239-4ad0-8f5d-34b75649e7c7', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Petra Okinnaka\",\"message\":\"Petra Okinnaka has confirmed their attendance.\",\"guest_id\":30,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-20 22:31:21', '2026-05-20 22:31:21'),
('607e6ae2-2d32-43a6-b325-ded6ae066e42', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Tze Ren Tang\",\"message\":\"Tze Ren Tang has confirmed their attendance.\",\"guest_id\":45,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-21 21:09:07', '2026-05-21 21:09:07'),
('acacb9d5-bbaf-4761-9670-7c0f5d171530', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Ankita Puri\",\"message\":\"Ankita Puri has confirmed their attendance.\",\"guest_id\":33,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-22 17:42:13', '2026-05-22 17:42:13'),
('e57ead14-343e-4eac-b7f0-a39ef4c453cb', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Donghai Wu\",\"message\":\"Donghai Wu has respectfully declined.\",\"guest_id\":50,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-23 12:11:10', '2026-05-23 12:11:10'),
('3bfe1db3-b1e3-4c35-af0a-ca28be836fd8', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Namrata Bhagia\",\"message\":\"Namrata Bhagia has confirmed their attendance.\",\"guest_id\":32,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-23 12:52:05', '2026-05-23 12:52:05'),
('2f7cd751-b1d5-4e01-a47a-5096c23aace6', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Benita Foo\",\"message\":\"Benita Foo has confirmed their attendance.\",\"guest_id\":40,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-23 16:02:52', '2026-05-23 16:02:52'),
('3247975e-88a0-4bdb-a0c2-9adba2e427d0', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Brandon Fitzgerald\",\"message\":\"Brandon Fitzgerald has confirmed their attendance.\",\"guest_id\":41,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-23 16:51:29', '2026-05-23 16:51:29'),
('f2f5fc25-d65e-4cb8-a9c1-67c1a4f72326', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Marc Reeves-Newson\",\"message\":\"Marc Reeves-Newson has confirmed their attendance.\",\"guest_id\":22,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-24 22:59:35', '2026-05-24 22:59:35'),
('26de99b6-c27e-4654-8f8d-97e1d2fdcde5', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Chow Mee Chin\",\"message\":\"Chow Mee Chin has confirmed their attendance.\",\"guest_id\":54,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-26 08:35:51', '2026-05-26 08:35:51'),
('416433d3-16f6-4d06-b04a-5987b4ffe520', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Felicia Thomas\",\"message\":\"Felicia Thomas has respectfully declined.\",\"guest_id\":53,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-26 09:28:25', '2026-05-26 09:28:25'),
('c9f48f34-4343-4185-8a4d-9fde33cc7695', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Jasmine Khurana\",\"message\":\"Jasmine Khurana has confirmed their attendance.\",\"guest_id\":15,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-26 10:02:30', '2026-05-26 10:02:30'),
('1433b256-2d5a-40e1-ac85-cbb050b07151', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Natalie Ploccienik\",\"message\":\"Natalie Ploccienik has confirmed their attendance.\",\"guest_id\":21,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-26 15:14:35', '2026-05-26 15:14:35'),
('92bec5b3-40c0-4dc8-9c24-8c22e5100d5d', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Diane Kim\",\"message\":\"Diane Kim has confirmed their attendance.\",\"guest_id\":42,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-26 22:33:43', '2026-05-26 22:33:43'),
('b1bdc380-9ea4-47c4-8822-d7df76f8305f', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Elisa Jean\",\"message\":\"Elisa Jean has confirmed their attendance.\",\"guest_id\":28,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-27 13:19:09', '2026-05-27 13:19:09'),
('fa2dd1c2-eb0e-4230-bdf4-c2ec7dbee230', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Sorenia Chatzialexiou\",\"message\":\"Sorenia Chatzialexiou has respectfully declined.\",\"guest_id\":37,\"attending\":false,\"plus_ones\":0}', NULL, '2026-05-27 18:57:13', '2026-05-27 18:57:13'),
('2abacfc2-f6c4-4212-8ee5-b3565c86208c', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Eric Dyer\",\"message\":\"Eric Dyer has confirmed their attendance.\",\"guest_id\":18,\"attending\":true,\"plus_ones\":0}', NULL, '2026-05-28 12:23:23', '2026-05-28 12:23:23'),
('e88d9bf1-1937-4086-a683-3d05c6ed2d52', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Nilesh Pandey\",\"message\":\"Nilesh Pandey has confirmed their attendance.\",\"guest_id\":17,\"attending\":true,\"plus_ones\":0}', NULL, '2026-06-02 11:32:45', '2026-06-02 11:32:45'),
('8faa6f25-9273-4672-b768-08fc225ff8d0', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Neville Ondenge\",\"message\":\"Neville Ondenge has confirmed their attendance.\",\"guest_id\":51,\"attending\":true,\"plus_ones\":0}', NULL, '2026-06-06 15:01:39', '2026-06-06 15:01:39'),
('5b79f3eb-0349-4f61-a0e4-c5ff176b3b70', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Alex Guerrero\",\"message\":\"Alex Guerrero has respectfully declined.\",\"guest_id\":39,\"attending\":false,\"plus_ones\":0}', NULL, '2026-06-11 16:37:43', '2026-06-11 16:37:43'),
('18400018-3d8b-4816-9019-fb6ce80c672e', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Gabi Steglinski\",\"message\":\"Gabi Steglinski has respectfully declined.\",\"guest_id\":48,\"attending\":false,\"plus_ones\":0}', NULL, '2026-06-12 22:15:00', '2026-06-12 22:15:00'),
('cf42b8fe-c0e6-4322-8b6d-f5bc6a053dcc', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Senthuren Jeganathan\",\"message\":\"Senthuren Jeganathan has respectfully declined.\",\"guest_id\":25,\"attending\":false,\"plus_ones\":0}', NULL, '2026-06-14 09:32:55', '2026-06-14 09:32:55'),
('2546f3ab-93a2-47ba-8657-2a3eb88410bc', 'App\\Notifications\\RSVPReceived', 'App\\Models\\User', 1, '{\"title\":\"New RSVP: Laxsanaa Siva\",\"message\":\"Laxsanaa Siva has respectfully declined.\",\"guest_id\":26,\"attending\":false,\"plus_ones\":0}', NULL, '2026-06-14 10:53:25', '2026-06-14 10:53:25');

-- --------------------------------------------------------

--
-- Table structure for table `page_contents`
--

CREATE TABLE `page_contents` (
  `id` bigint UNSIGNED NOT NULL,
  `section_key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` json DEFAULT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `page_contents`
--

INSERT INTO `page_contents` (`id`, `section_key`, `content`, `is_visible`, `created_at`, `updated_at`) VALUES
(1, 'rsvp', '{\"title\": \"RSVP\", \"page_title\": \"RSVP\", \"description\": \"We can\'t wait to celebrate with you!\", \"deadline_text\": {\"en\": \"Please RSVP by July 1, 2026\"}, \"page_subtitle\": \"We can\'t wait to celebrate with you!\"}', 1, '2025-12-30 16:20:56', '2026-04-26 16:04:37'),
(2, 'countdown', '{\"title\": {\"en\": \"Counting Down\"}, \"subtitle\": {\"en\": \"Until the big day!\"}, \"wedding_date\": \"2026-11-14\"}', 1, '2025-12-30 16:25:26', '2026-04-26 16:03:29'),
(3, 'home_hero', '{\"venue\": {\"en\": \"Zereniti House, Limuru, Kenya\"}, \"location\": \"Nairobi, Kenya\", \"subtitle\": {\"en\": \"We\'re Getting Married!!\"}, \"date_text\": \"November 14th, 2026\"}', 1, '2025-12-30 16:25:26', '2026-04-26 16:06:16'),
(4, 'our_story', '{\"date\": {\"en\": \"March 29, 2022 - Our first date\"}, \"title\": {\"en\": \"How we met!\"}, \"content\": {\"en\": \"We met on Hinge! We had an amazing connection and chemistry almost immediately when we first started talking. We even watched a TV show together (called Upload) before our first date. On that fateful day of the first date, Dinah grabbed Tze Ren\'s hand to cross the road and the rest is history...\"}, \"content_2\": {\"en\": \"We got engaged in Nova Scotia on the beach, about  two years after we moved in together. Probably the best decision, ever.\"}, \"bride_name\": {\"en\": \"Dinah\"}, \"groom_name\": {\"en\": \"Tze Ren\"}, \"bride_image\": \"/uploads/1767122779_vu56jRWhee.jpeg\", \"groom_image\": \"/uploads/1767122784_B5vTWdcfQT.jpeg\"}', 1, '2025-12-30 16:26:45', '2026-04-26 20:03:28'),
(5, 'programme_page', '[]', 0, '2026-02-10 03:59:11', '2026-04-29 17:59:12'),
(6, 'rsvp_page', '{\"date\": \"November 14th, 2026\"}', 1, '2026-02-10 03:59:11', '2026-02-10 03:59:11'),
(7, 'events', '[]', 0, '2026-02-10 05:14:35', '2026-02-10 05:14:35'),
(8, 'gallery', '{\"title\": {\"en\": \"Our Engagement Photos!\"}}', 1, '2026-03-11 17:04:13', '2026-04-26 19:57:55'),
(9, 'songs_page', '[]', 0, '2026-03-12 05:46:32', '2026-04-29 17:59:12'),
(10, 'footer', '{\"message\": {\"en\": \"Looking forward to celebrating with everyone!\"}, \"couple_names\": {\"en\": \"Dinah and Tze Ren\"}, \"contact_email\": {\"en\": \"info@dntwed.okjtech.co.ke\"}}', 1, '2026-04-14 20:24:37', '2026-04-26 16:05:30'),
(11, 'gifts', '[]', 0, '2026-04-26 16:08:05', '2026-04-29 17:59:15'),
(12, 'guestbook_page', '[]', 0, '2026-04-26 16:08:16', '2026-04-29 17:59:10'),
(13, 'language_switcher', '[]', 0, '2026-04-29 17:18:32', '2026-04-29 17:18:32'),
(14, 'faqs', '[]', 1, '2026-05-06 14:11:18', '2026-05-06 14:11:18'),
(15, 'contact', '[]', 0, '2026-05-06 14:11:22', '2026-05-06 14:11:29');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 'App\\Models\\User', 1, 'wedding-admin', '68686f70eb006487ee3f33c0f354b86e42cb2bed453df8940557b39d63f49d31', '[\"*\"]', '2025-12-30 16:48:16', NULL, '2025-12-30 16:25:07', '2025-12-30 16:48:16'),
(2, 'App\\Models\\User', 1, 'wedding-admin', '0f236b88c505c28a4aa991fc9a16abf9888b5d38ce876ac22b56c9219e11ac41', '[\"*\"]', '2026-01-06 08:05:22', NULL, '2026-01-06 07:49:49', '2026-01-06 08:05:22'),
(3, 'App\\Models\\User', 1, 'wedding-admin', '1fbfaea7e6e0d383ac8a0f34e0ad47b3a7ab6b09c6d60fb9d921d2f867161ee4', '[\"*\"]', '2026-01-20 07:24:56', NULL, '2026-01-16 08:52:22', '2026-01-20 07:24:56'),
(4, 'App\\Models\\User', 1, 'wedding-admin', 'ebee5b0fcd6b8f5fbea64f9282967ca1ac05887a6a03fe59db6066b6413010a6', '[\"*\"]', '2026-01-17 18:31:52', NULL, '2026-01-17 17:53:33', '2026-01-17 18:31:52'),
(5, 'App\\Models\\User', 1, 'wedding-admin', '72e208aac6c182d51178dd4ccae531007a24179d6f0c77865e8a9f5eca7d77ce', '[\"*\"]', '2026-01-17 19:34:27', NULL, '2026-01-17 18:32:06', '2026-01-17 19:34:27'),
(6, 'App\\Models\\User', 1, 'wedding-admin', '5f140dbb37a2852ae319a488ca126b81b0eb6888e6f9c8982a61ac83df540e16', '[\"*\"]', '2026-01-20 06:45:04', NULL, '2026-01-20 04:15:58', '2026-01-20 06:45:04'),
(7, 'App\\Models\\User', 1, 'wedding-admin', '405d583e19e26edaa9dbf7e7b31c4ecdea4b710f9c7def5dfa7e552e4d01e23c', '[\"*\"]', '2026-01-20 09:31:19', NULL, '2026-01-20 07:25:13', '2026-01-20 09:31:19'),
(8, 'App\\Models\\User', 1, 'wedding-admin', '1194b325588041736eb27877a450bdf548076ae71a8a4f43eb9eaeaca565f893', '[\"*\"]', '2026-01-29 07:25:05', NULL, '2026-01-28 08:46:38', '2026-01-29 07:25:05'),
(9, 'App\\Models\\User', 1, 'wedding-admin', 'fa4153f9c062c2854c8cdccb85c90766b04c39f0902c65830036a6f9f4dc260c', '[\"*\"]', '2026-02-09 05:23:17', NULL, '2026-01-29 07:25:34', '2026-02-09 05:23:17'),
(10, 'App\\Models\\User', 1, 'wedding-admin', 'ed4918c32c5fce11ddcb22b8d8c7814b97e5a399a1813c1df2cab85e88ff4310', '[\"*\"]', '2026-02-06 07:02:51', NULL, '2026-02-06 06:10:57', '2026-02-06 07:02:51'),
(11, 'App\\Models\\User', 1, 'wedding-admin', 'f681ea6f5434c4f5fbe6c280ed94ab89ab93e879b8c307151af07a5019058ac8', '[\"*\"]', '2026-02-06 14:18:11', NULL, '2026-02-06 07:03:01', '2026-02-06 14:18:11'),
(12, 'App\\Models\\User', 1, 'wedding-admin', '850406a12752019159c0abbb76fd886733106746a4d5bf2c4a0fb77834a0243b', '[\"*\"]', '2026-02-06 14:28:51', NULL, '2026-02-06 14:18:23', '2026-02-06 14:28:51'),
(13, 'App\\Models\\User', 1, 'wedding-admin', 'b924847632b21f6ea51ec6ba001dd2c053356c4691e91d930ea0aae48705f1c2', '[\"*\"]', '2026-03-11 15:41:02', NULL, '2026-02-06 14:29:00', '2026-03-11 15:41:02'),
(14, 'App\\Models\\User', 1, 'wedding-admin', '0f505483b56c5df5c5eb72189e81f2d1b04300d1215f761f713b200c1d11c4e9', '[\"*\"]', '2026-02-09 05:39:49', NULL, '2026-02-09 05:23:46', '2026-02-09 05:39:49'),
(15, 'App\\Models\\User', 1, 'wedding-admin', 'a410fecaf5398731729ec9a7398716fb9a3fce52153a17a816bfd8929092295a', '[\"*\"]', '2026-02-09 09:15:37', NULL, '2026-02-09 05:52:14', '2026-02-09 09:15:37'),
(16, 'App\\Models\\User', 1, 'wedding-admin', '94953d3632d65f60d78cd679762c3a525b2e61054854e9e15b60d7e283aa113f', '[\"*\"]', '2026-02-09 15:21:09', NULL, '2026-02-09 15:05:20', '2026-02-09 15:21:09'),
(17, 'App\\Models\\User', 1, 'wedding-admin', 'd57d9e931623914f228b626d6a60e41fa3626924e703b1ad6e5bcbba780227b3', '[\"*\"]', '2026-02-09 15:22:13', NULL, '2026-02-09 15:21:22', '2026-02-09 15:22:13'),
(18, 'App\\Models\\User', 1, 'wedding-admin', 'f122d5ae2655f793d2855d22fec3116bc98a3377dc8e57e2ae9e0aabc90281c1', '[\"*\"]', '2026-02-10 05:27:00', NULL, '2026-02-10 00:01:04', '2026-02-10 05:27:00'),
(19, 'App\\Models\\User', 1, 'wedding-admin', 'aa7b15671ae81fe54dcccce59425f2d0bbb4a0a0266335e67f400f12443b2620', '[\"*\"]', '2026-02-10 05:59:10', NULL, '2026-02-10 05:31:40', '2026-02-10 05:59:10'),
(20, 'App\\Models\\User', 1, 'wedding-admin', '0d96f0cab606b52e64fbf883e3f19bcfa371f7917f675b04592e8718a20fe2a2', '[\"*\"]', '2026-02-10 06:23:42', NULL, '2026-02-10 06:00:07', '2026-02-10 06:23:42'),
(21, 'App\\Models\\User', 1, 'wedding-admin', '1def39430bd8fe0cd5d8299b7cd70afb1942db70d18d994ef446b6b431d76ab4', '[\"*\"]', '2026-02-11 04:18:26', NULL, '2026-02-10 06:40:19', '2026-02-11 04:18:26'),
(22, 'App\\Models\\User', 1, 'wedding-admin', 'a4ecffe268756b10403529d6d431238baf3da06dddfc65fa549b2e96bac80567', '[\"*\"]', '2026-03-11 15:51:15', NULL, '2026-03-11 15:51:13', '2026-03-11 15:51:15'),
(23, 'App\\Models\\User', 1, 'wedding-admin', '58f1efaac1ad553129db0edaaac36716996c9ff7434cd5f0700f8fe926125d4e', '[\"*\"]', '2026-03-11 18:34:31', NULL, '2026-03-11 16:55:34', '2026-03-11 18:34:31'),
(24, 'App\\Models\\User', 1, 'wedding-admin', '71ae4ac0b704dbecf90ec6e75a5d9ba26fb1eae85b8e7ffefc070cd803ba41b9', '[\"*\"]', '2026-03-11 19:09:22', NULL, '2026-03-11 18:35:21', '2026-03-11 19:09:22'),
(25, 'App\\Models\\User', 1, 'wedding-admin', '88fc24503c60cbe2130159b580aee368ffaa68b21f9f518fb257a9801ec66a75', '[\"*\"]', '2026-03-11 23:47:03', NULL, '2026-03-11 19:10:08', '2026-03-11 23:47:03'),
(26, 'App\\Models\\User', 1, 'wedding-admin', '0cc91857157669f594a172541dc6179f1b18199fe152893829540e23349008f6', '[\"*\"]', '2026-03-12 00:58:51', NULL, '2026-03-12 00:21:37', '2026-03-12 00:58:51'),
(30, 'App\\Models\\User', 1, 'wedding-admin', '89cc332a8fefef2f5e9921f00352135bbdd5a64ac098a04116e32cd8cf6dd2a4', '[\"*\"]', '2026-04-01 15:51:01', NULL, '2026-03-31 18:21:10', '2026-04-01 15:51:01'),
(35, 'App\\Models\\User', 2, 'wedding-admin', '20579e8236f609e897327f4d052adf2ffae784d4541a589e2d4ec5431dcc6566', '[\"*\"]', '2026-04-14 16:24:35', NULL, '2026-04-03 07:15:31', '2026-04-14 16:24:35'),
(36, 'App\\Models\\User', 2, 'wedding-admin', '6e35ad362a3c0e50035db53cc8f0a86ca4cafb2b6135de6dc20eddc7ac6a6f69', '[\"*\"]', '2026-04-14 13:09:41', NULL, '2026-04-14 12:30:29', '2026-04-14 13:09:41'),
(37, 'App\\Models\\User', 2, 'wedding-admin', 'ed76ef91d5591a5c83e81eeb811899e814d292ac78cec4b9ccc19dcafb660b20', '[\"*\"]', '2026-04-16 15:29:48', NULL, '2026-04-14 13:09:40', '2026-04-16 15:29:48'),
(41, 'App\\Models\\User', 2, 'wedding-admin', 'b8e43a8d081b200038f999ad25f96117832ffa3a488a60f439d4173088e08b89', '[\"*\"]', '2026-04-23 12:07:51', NULL, '2026-04-16 15:29:48', '2026-04-23 12:07:51'),
(44, 'App\\Models\\User', 2, 'wedding-admin', '4c9c8aeb111a0c1d0addcabd861d94fe63d147b7144439b9a3fd091dd6526508', '[\"*\"]', '2026-04-26 15:40:25', NULL, '2026-04-23 12:07:51', '2026-04-26 15:40:25'),
(46, 'App\\Models\\User', 2, 'wedding-admin', 'a6a30760efda5668fee5b7ed73f87c2aedfd3696dfc09124badd9cfc5fe09b5f', '[\"*\"]', '2026-04-26 19:52:35', NULL, '2026-04-26 15:40:25', '2026-04-26 19:52:35'),
(47, 'App\\Models\\User', 2, 'wedding-admin', 'a2b216520cceace0f9e2b3a9616cf916f4dd2de4ec081d586f7c5b38d3b5e468', '[\"*\"]', '2026-04-27 13:21:37', NULL, '2026-04-26 19:52:34', '2026-04-27 13:21:37'),
(49, 'App\\Models\\User', 2, 'wedding-admin', '18c2dae9c8839ae6fde9cd56d3c040bfcdc9c727103999901238b760d164642e', '[\"*\"]', '2026-04-27 13:33:21', NULL, '2026-04-27 13:21:37', '2026-04-27 13:33:21'),
(50, 'App\\Models\\User', 2, 'wedding-admin', '78c6c6c4878eb47c3f9d42e3944aac562dfea325881c564d9c81447fa3c6bfa5', '[\"*\"]', '2026-04-27 15:35:01', NULL, '2026-04-27 13:33:21', '2026-04-27 15:35:01'),
(51, 'App\\Models\\User', 2, 'wedding-admin', '3c3e13a780b3186ac05d8469f8deb393283f370d69cd826316b46c6e8954a280', '[\"*\"]', '2026-04-27 16:52:35', NULL, '2026-04-27 15:34:59', '2026-04-27 16:52:35'),
(53, 'App\\Models\\User', 2, 'wedding-admin', 'db7669c0974946b453dfb94130183206ffeaa86f96a492a171b9f163807240a1', '[\"*\"]', '2026-04-27 23:15:51', NULL, '2026-04-27 16:52:34', '2026-04-27 23:15:51'),
(54, 'App\\Models\\User', 2, 'wedding-admin', '306a55ef11689018666be00ce9745abec5d2f025e1c9eaee7e863ab3362f18e3', '[\"*\"]', '2026-05-05 15:36:42', NULL, '2026-04-27 23:15:51', '2026-05-05 15:36:42'),
(58, 'App\\Models\\User', 2, 'wedding-admin', '530057820e372baf5f54c708c0672d68cbf4ac6f050c4637e3d799cb54ebce9c', '[\"*\"]', '2026-05-07 13:24:28', NULL, '2026-05-06 11:57:10', '2026-05-07 13:24:28'),
(59, 'App\\Models\\User', 2, 'wedding-admin', 'fae23f08a2d9a6893a08a06153d9f5bdfbfb0e75529a939f5df5481ed0bc7b08', '[\"*\"]', '2026-05-23 21:53:25', NULL, '2026-05-06 22:04:12', '2026-05-23 21:53:25'),
(62, 'App\\Models\\User', 2, 'wedding-admin', '34153a708413557554601dd91864378f694f514994452e8f4034ce83a4d761ab', '[\"*\"]', '2026-05-13 14:49:22', NULL, '2026-05-07 13:24:27', '2026-05-13 14:49:22'),
(63, 'App\\Models\\User', 2, 'wedding-admin', '152f0ff0bfec534795df5feadc39928105e51c5e79201ebbd038732297f73851', '[\"*\"]', '2026-06-16 08:53:51', NULL, '2026-05-08 09:02:12', '2026-06-16 08:53:51'),
(64, 'App\\Models\\User', 2, 'wedding-admin', '087cadd15e4029b8b9112ae0625a225eff541a0325256c5103ae92aa793a3a10', '[\"*\"]', '2026-06-08 11:45:59', NULL, '2026-05-13 14:49:22', '2026-06-08 11:45:59'),
(65, 'App\\Models\\User', 2, 'wedding-admin', '88b85ffe44276e957ef97e65b457200a2804bf2a6c315c0a0b91279dd54f42d5', '[\"*\"]', '2026-06-09 11:06:16', NULL, '2026-06-08 11:45:59', '2026-06-09 11:06:16'),
(66, 'App\\Models\\User', 2, 'wedding-admin', '6fdead8e202e5a8f5fdaf6e035a246851c66b04d69001702453ea95fe2250eaa', '[\"*\"]', '2026-06-15 16:50:04', NULL, '2026-06-09 11:06:16', '2026-06-15 16:50:04'),
(67, 'App\\Models\\User', 2, 'wedding-admin', '0ccb6a444b614b5dfa82d984f421e81940178679abd4f560ebb9afa8caa1b9a2', '[\"*\"]', '2026-07-06 20:26:50', NULL, '2026-06-19 13:34:47', '2026-07-06 20:26:50');

-- --------------------------------------------------------

--
-- Table structure for table `polaroid_images`
--

CREATE TABLE `polaroid_images` (
  `id` bigint UNSIGNED NOT NULL,
  `image_path` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `custom_size` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `offset_x` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `offset_y` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rotation` int DEFAULT NULL,
  `location` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `guard_name` varchar(125) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_has_permissions`
--

CREATE TABLE `role_has_permissions` (
  `permission_id` bigint UNSIGNED NOT NULL,
  `role_id` bigint UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedule_items`
--

CREATE TABLE `schedule_items` (
  `id` bigint UNSIGNED NOT NULL,
  `event_id` bigint UNSIGNED NOT NULL,
  `title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `location` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `status` enum('upcoming','current','completed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('8h8kZnDVkgpXwaaqS4Ex9mXZC3Hiw4nXmcXHyZ20', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSXZIbW9pWlFWT0FJQjI1UTlodlp4WVpaaWljQ1NDT0hzRzcxbWR1MCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776364629),
('pK70nILZ5ZYLTrsAyx4FoBGXN9IwWTDsVxvDfK46', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiN1RVZ3R1YVhvMU5MV2p0bmx3SW1MbTVmY1BvNU1DbVJMNWYwSDRIMCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776364574),
('gLsHb0fMUPsqHhejQVajbLtk3NFZY9I9lUv6Ubkd', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTVR1eVRTTkRDeDZEamk2UGY5UDVhQXJrTHRsdVd0VE1ZUndER004YiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776364574),
('PW4zvCrbdOShVCSRhRgsdtq0TrqGBBvTXlFlLXwq', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNDdzZDRiVTJqa09IbnZzckZNeklXQWVBWmtxNEIyMHZmTjNEYTFGOSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776364192),
('nnkVfhcX1VUT3xcmGAfehieIAq3EPh9VEEkd1zCL', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicEprNjllZ1BTMGN5blN2ajZoTDQyZFFzdkVwQmNnZEFQcFhsYThtaiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776364192),
('H4Q5DjPumJvxEUl3KpBsycuOlBzJW2oxWzwmch0H', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUHZ1WnpyZGoyNjJYT3lIMFNwREJhMnk3ajRnWm9xUWRaVWNBUGRtbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776304097),
('PwroK7SKaJ6KAqmVb56WpTwUfF0vx2qVpDzh1Q80', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoia2J2S3ljdzlPenVLaWFZbTI4YmJUbXRqeW1USWVWd0JaRmZTd01UQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776304097),
('JwQzO5SxzHECN72ywm2nPY7Ons6Yzh82UMuM1d0B', NULL, '23.27.145.65', 'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/120.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSjVPVzFEbVU0ZHVEZ2dTUVU3TW5GaVhRVEhud2FPemo5TzN2TDJLOSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vd3d3LmFwaS1kbnR3ZWQub2tqdGVjaC5jby5rZSI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776290932),
('g5KCGTBNEuMqYwt4MlVaREVoZyk2MaVw6V4nc54m', NULL, '23.27.145.89', 'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/120.0', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUTZ6NmxBVHc2ZkpxS0I3Vkd4ZGlQTVZncE5EdzZWdzB2UGh3MjZBYSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vd3d3LmFwaS1kbnR3ZWQub2tqdGVjaC5jby5rZSI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776301380),
('zUr1EyjJhQdE9uxvgnFL1ad9NA1drHaWR2vZMNpO', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSzRJNDVKSnVkVVFHZTczMUxKSERFMkhsU2xwWDJCMnRVSzlBYXVXaSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776215224),
('QUga97Ntcy2uCUVcLNbfaG0gGcHMReryjpYNhWxX', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUm5ldXBFYmRzY2xIOG0zREVBQUpQV1F2MkdrbGpvN3c2Tm4yc2phSCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776215224),
('0UlUCJNHYDTzwybD26WSjxOocFi4vgv6BisRsL5x', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVFBsQmc2b25yQWVNNFBTekcwUXlrdjkzREFpSGlVTHVvaHBlQm90QyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776209984),
('No5jNWI8W8j87h4m0TA4LAIRAGYINLaNfHEDsuo1', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoib0ZFaGFETnduUGFnTTJuRHV5WEFpQlNKb1hpVFI4RG5yNkZHaFlicSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776209984),
('HKwi4gwzN7LWWfLNPZm5ZgjhPIRv1PXR8YFw2JVn', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiY3ROZTNMV1JEaEFXMFJHbWxjd3RJcDgwUVVhdEZFakJFdWs4Q2ZNWCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776209268),
('LXodE5OLuRu9IwoW9RWcCbQh8WTcVoQ26UajHaef', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUFByOElsVHBXWnd6UjNPWURKbEluZ1hCcWF1MDZhcHRHTkJQMHA3eSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776209268),
('cFk8SVDrGrhZ6X4hqMFkiURYzcoB4lEL9vSMoM6z', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicEMwcUhPN3NldExEQkZFZ0hUSUszTk9DTXAyYnR5ckFiSG5acDkwVCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776208821),
('CuNfi0m0avUrx2bFjmhzP6BoRKKqJPS3PHSw3f3V', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMndwZmthYUJHNXNoZzBVcHNza0dsaWNhM3RTVlBXVDZiRGNDSERtUiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776208820),
('GhKSOCTXfQTNyDI6uAMVAMMsZuFzKDvLiyjJmGXc', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUlZLVnB4T2FwRDVheEJlYjlEUGs4dU1ySkxQOUVWd1liZmx6T2FQSyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776208711),
('1WfoOnBiJ0LRAgCymnIWReQnwKmtJeClSRRLowEV', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiOWtmUHNIVldDTG9oZFY2OVFYOFBja1M5RDFpdVhDajRBTExqWnM4TSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776208711),
('1D6gxbllHDYR4bLvGjxB7hRJCBPwWSn6pwzBwajU', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSnhmdW40bEJtVHh4bG9ZeWk4ZTlUOFppZnJXSER1NmlJdXlrV2RscSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzc2MjAxNjI1XzR1cUpyZWdnMVEuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776201625),
('n4uKUIKAyeExQMyJuq6BLqcci48gamCGcsCieCOP', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoib0xEQXN4VmtKdjlKZWJZajh2WWE1OTBqWkxOM0JSOUxvVmhRYVVTbSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776202917),
('FOcCRpSUMYzbO6SWjAyfVkR8XGDPHJ8N6GymHwF9', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicVJWRE9LSm9kYzRiRU9RVjVoUU9wTkppcmkyS2dsRHhjRXVKR3FseiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776202917),
('2ZFbduZwFyhmIyoU4Y5t8nLAS5k7vmxJzvjOMYNX', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNUtBMXRNUmZlY0JaWEtnR1p1eFQwU2FYQ2doNlNtaVZXZ1ZndlgzZiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776202944),
('wP6S926GO5FghrqQLtOMTdytKO0YDM4lLuPseCiQ', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNkNXVGxhS29keEY5ellLQ3VLZWRWYjRBekhSRTRxMkJUampJYlZzUyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776202944),
('97anF6FEXK9SAABuIbNPx6aexZ7lwplh93AgAMdj', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoid2o4cnk2aDFVQnd2OEtwbW01Q3A3djFrZzFlb2d3ZDZLbnJpUnlDaCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776202979),
('Hw6jpZBwH9rCsv8IAtz5IVUNpOCsvKNbZHsregJ5', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiQjRLSzYyTzY1cG5OMmFjMkZyQ0ttbmlibzFhb09XOVp1NEJLRE5FTSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776202979),
('8jzbQcnLJP6SpkyVFoFS8FSfBg0bW2IDbEsgqm8Q', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiN2xNWWpyckt1dGZlU0JseWdZQ3VQSG9sSTNzd2JNVWs5b09tVUtuMSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203297),
('5F6itXFySEEURpvAxujAvjmcnQ8hr3zRnbQ6OJBs', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSHBHQlAyR3hnNWs2d2ZNRVB4cjM2TXFVdWczbFB0YWRMZjUzTHVKbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203297),
('0GSwaUzjMxFYBOiwbTf0CTCkRA4LALaGp4iTJ4hw', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiT01jcDM5T0NFNzJGWjVuV3BSR2NSN2s3V3F5NnRVV1hacW5wQnl0OCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203696),
('S5f2ECKp5cvnxjCNRYws3SR78WgaUyD97kI1zx9A', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoic3FDUmdOMVA4bnpVVjBKTlF4NE9EYWFJVWE0cmhKRWQxbXFzZ3UyaSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203696),
('DY4s2RAypZ9RG5B5m0g0dVLFEUetXWTnuWBEgPcJ', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWnRqd0lmSGZCa2R4TGEzSWJPa1FBYUtURXFZQ1U4ZFJWdVFSM1dHMCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203742),
('GqxjePmvQkbp4G43SAE8alHHgYpJmuf6UbL7mR8t', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaXd5M2hzQkJCNFlvUDVxWGVaR05Mc0FJNTFuSm5PTGNsYjUzTDVsZyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203742),
('eNzR469P6nfVJOBgdG66em1W4Zs1SHEdyTNjY3PV', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidTZrNkhMZFQ1am1pS1c0MlhueG1SdlVzcmU0dVBwY2dZVnh1MWVLTSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTYwX1o2SlRaRDlLU0kuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203821),
('Q2angt8zziNuumoeoudxENNzRVIiUfwq7a856esS', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidkZkNDd0WVUzN1ZsS1Z3bGlqSlZRbDFpVFFLUjdyc3N5Q1FmRzQ2bCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjgzX2FjRzM4WGZydEEuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203821),
('tWkXFUCgdDcKg5t4xjXiv0dwMsFuLSSq3N2KdKSq', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoid1YyNnEzVjNQb3V1bTlSbGpXd0FzdTJ3bWF0UXJaT3FiT05JUmp0MyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTQ1X011RlExVXFlbU0uanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203821),
('ZibNZ5hc1TIFeqh8D0iDnEmLwMLS7GbwuBBH1GGp', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiYXBDQWozSTlkZ3J2b3hWa255a0x4Qkg3cklGSVU0NnJVM2tjRzMyNSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjM3X0hEeHdEY1VqNTguanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203821),
('aj0SyQdpHD6FhW8G0YwB33mrQVf4YUfj4nVr9Ait', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUVBTSVF6dVpBcXIyeWRpMzE2bjZuTDV3dDRPUHYwSk9pQW9hMXlEZCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTc3X2FWVUEwSHJseHIuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203821),
('hsbT0qs0b11wdayjRR7wonzn1lI1VXDpkVFtdnFA', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSkJCNDFHZmh3OVRFZms0WmhMUkFJbWpDWUgyRFQyYlZVWUpZMXdPMyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjA4X0FxbDZ1M205RzQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203822),
('u2hOHDOgQGooXB2Z1FCdnqiU145tes1v8Oqe2ZCZ', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiODZpeXpnekN2eTJMRWtzT3R3eW1JdnNUOGp6SlFaVFhMME1PY1h5SiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MzIyXzRuM0U0UVNMTnouanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203822),
('dcf0AKrKP4raeF6uUE7sn7LQFqremXQxG7J7bv1C', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWFpORHJ2ZXFSQzVGdHVWUm1vb3VkRlRXSVdobE04VkEwdElyZ0JXSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5Mjk1X3FyU3M2ZHl2OVouanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203822),
('TDteihTUjhUXmp2asj0qszHTNJkYfO2UAV5skvRE', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiR2dSdnNBWmpaUGI1V0VvcnBERWxoZXA1eFZNUWZUWkdlUHJibUZTYSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MzEwX1BpOUdvS3N2Z3kuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203822),
('wcEtZL03Z8dyWABJnftD0tEMSe9RysBzpRHLnzMC', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTVJlaWZLZ0pZdlhFN3JFcEFrZG9QZnJQcklsd2NFSk54NnZ0Tmh2NCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjIzX0lVaWZ1NEo0VDYuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203822),
('w8etfvbB9ZurEgD5X5QvVKXt6xyx7IAsBLj52rE7', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaU9yelVIU3hSUnZCVnlvaDJScU5XR3QwcHRlOWtTVmFRNG81bGd2cCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTk0X0F2c2NOdjk3MEQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203823),
('kIFGgo9ZyWz6T2qINoLzyHZEiPJGO74ADBecAt4K', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZW1SVkFVY0NTYk9paUVqR01uSGQ5eGFnc2k5bUJDZ1F3VHNQblNBNCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTMyX3Vtd1d3NDZFQUguanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203823),
('F5DidO3Mi0jtdLT2hWEufIFvbTwzjVSDrHuqJUwu', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNDZOSklPTllkd3dzeTFQa0lDS01QTHNJeElvWkJzd1VEZWR6bWtCWiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzc2MjAzODc4X0wxTmZFQjE4eFkuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776203883),
('vZ0VftKzQyGlCFfVHjG4pgUHw0GPq6D0gue7sygQ', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiTmxqeUFjUVNDSThLU2tsTklONlB1NkVETlJSYW9ET0pBaHo5cjc4aiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205145),
('Vd711ia25IV8XENcA9Q5AQXpdXUZWWZXEIHWepAz', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZ1JMazJuaWFDZ2x6VG5ZUVhjMXdTY3p0T0N2ejBjR2lyMENjMFZjbyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205145),
('57hOAzdzBwCekBhzZrqhVQauhN6q6oJO4E8btDat', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiQ0lnQm94WVlyRTZxQWhJenRDb2VTcklqekFsZFF2b1c0NmJuYndiVyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205339),
('SjlZJ3j3RNqp72tUouIHdiHvV9YaTzzrpHPPH0IJ', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoienRTM1JOZTVwR3lBbHVVNVhRdzAzaVZzOHkxbFNkRUFTRUZ2Qzl6SiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205340),
('VFz96xfb3kKHO5DTV0NurMKi5lGqfZPvcqAjnfuL', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoic1kzY01pYkk1VW9LWlpqYUVTeFBTVTB4bjVsOHV0cUxPejV5MmE3RCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzc2MjAzODc4X0wxTmZFQjE4eFkuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205388),
('mAPKjC5NY0Rs6XnnD4TZzfr7y2PPLdB8AWnR6gim', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibkdkWU5nY2FQYTZOcGRVb2xSYTVEeGxtZXhBYnY3dlJWcndoS1B0TCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MzIyXzRuM0U0UVNMTnouanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205389),
('JdkQpnaB6lZeGXUmhCOAcU5aYmN57JYxDZeyUlaY', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibUNnYWx4Tm1UbzJyaGV1YlFQM0RIODllMXczbklmSlFpSklyNDk4MiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MzEwX1BpOUdvS3N2Z3kuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205389),
('CBzhhknkUuwv1ScltGLzI0NeQrDYID0E1Dujsq94', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiM2FUQUhaZGJxWXpWbGFSN0xWaWk1aVBXWjB2TGwzT0N4cGk2eTRDeiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjgzX2FjRzM4WGZydEEuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205389),
('LWSDISD8g8wbPgniGo3Kd9vCKZ5x26mNCHp5Fl5h', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWUh3UzRpNlZUU3Q5VTNKOGowcWhWYlRMNEtwbUIxTTJIQjZqeTdYdSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjM3X0hEeHdEY1VqNTguanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205389),
('x4zfd38FJJYAjNoyEH6Nm73DJv1bRRWvXxrc70PU', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiOVpvYlVDUHoxdnFhZWViT1dxVWlkWXJVTGZBOGU1NlJNd3RRMDUycSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5Mjk1X3FyU3M2ZHl2OVouanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205389),
('5Mrikyqm2sh1I5rBCRp0bhFNQEB0AYjA4RnH9Qm5', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNWNiQTBkdm4zY3VOQk5heU9qUDJFRTJPcGY3d254dFlDaXEzOVFHbSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTk0X0F2c2NOdjk3MEQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205390),
('OM1JCE7VzluFlsC6i2TyzYUmD07kEefYYLrovbvf', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidEV1NXI1dUJCVktNSGl3aG1VTEtzaWloQnBoY3ZZN3IxbFlGcDdUSyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjIzX0lVaWZ1NEo0VDYuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205390),
('qkAmjmqtNWzhTXl0u7uLpD9VT6eo63PdxVaRKsrh', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaDlibWJtS3NEVlNWb3ZNVEJDeWw0ZkFUMmlVVndwTVJ3VFpzOUNDZSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTc3X2FWVUEwSHJseHIuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205390),
('4Mu6tky0wjV2QtMYxcZ18tkmCIuQgHjMtgXPgMjS', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiQkVFc2l3Y1c0c2N6ajJ1MU1SdTdacDRnV2pRVWhER2ttQzJTVGpGdSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjA4X0FxbDZ1M205RzQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205390),
('Rqb1fJSHyR8r6LtdxLHOJxeFK4HG2vT0aU9fMkFV', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUUVISFl2NjFpbmNpblJiQ1JWN0h2VzJ0MmJ5eWZyOENnejdZajAxTCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTQ1X011RlExVXFlbU0uanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205390),
('dl258B5MqVyoyeh0ftFUDIW4sQCRZxLSwPMs5vn1', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibXMwWWxmbmRjMlRLdmNZMElMdUp3UmIzb0FWZzlVV0ZvOGxidWFEYSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTMyX3Vtd1d3NDZFQUguanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205391),
('9fvrSgZNMOF5orKtv3oXofKlyDDKarFdc0Gk6vNC', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiSzBDZW9sR1J3Q2hlanhWcmlxdXVkQ3RkQVEyRkx0YVBnZlNKUHNDUiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTYwX1o2SlRaRDlLU0kuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205391),
('KWVOKc8YavhSrTRmAuUwHARZ8IOg1nv0cVjU2DWR', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiaUFnb25tckJNVWViVjZRUjVZWjV4ZkNKYjVXU2FldzJldGZLN2lNVCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205777),
('pSD6qarfVfwT4BjvEsVjezgyOpkP0tFcRpvHmdXd', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZUZKejRqM2o5clBlaEVaMFVlUGlacTlvbzJ2aEJVZ0xybDl0Rzg2SiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776205777),
('baytGgszsB23F2EyGOtvWwxBAVNHRcLEYwMcSTSK', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNTdKbEJaZDhZMXMweXRDaVk3Q2NsMnBYUUhyRHBjMDlxS2RHeXhFSCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206150),
('TWp2YCT3xUUXzRn8b9gehXnnHmfr0Nm9HSWME4yD', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWmE2ajY0cFBwVEltTlhZMDlRVXNIOEx0VkFVOEZxZ2ZLZG56WFBSSSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206150),
('6pp3AGIscx1UeU6HeVL9MgrYalnCIHVzQSdbHe43', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMmVQZ1dUZGduNEpCUkJSd0JxQmpwaWRqVHRWa2FLVXU4U1UwUFlOcCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206158),
('guqn9WPwkxSLTQR6iFRUoUCcK0RHzcdiJKVEYayo', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWUF4R2VDOWQzRUVWMEpNN0NzOWlQaENWOGlMYlAxM1AwYzR2UkN0aSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzg0X0I1dlRXZGNmUVQuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206158),
('NelMTSX57bufhxRToMz7alVcs339MyYoKcUx63aS', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiYmR5RVpjUDREb3pqSDNNZThHUkt5MEVTcEZDcDE3Z2FCNkYxbHZEMSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MzEwX1BpOUdvS3N2Z3kuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206193),
('mPCVVj16PRRAwtWIyKslDq5Kb2yad7p3pOOCKOyw', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiUE0zRjFCcTdBTHo1SjRLaHFZMUE1UGZNc1A1MG9qOWQwalRzbFhSUCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzc2MjAzODc4X0wxTmZFQjE4eFkuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206193),
('y6NkF5b9Qef6IopKN7x6J7Z3FRuOhcAlhFIY2Ahq', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoibExoR3JJM05kS2dEcHNqdlE1Y3Fqc0F4bUJJV1lEWjV1ekFCc0lycSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MzIyXzRuM0U0UVNMTnouanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206193),
('a0hFqViTqUpBqzQDg0PnlCElyAK7NvECW2ItdO8v', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiVW84eU8xTmRkWkRVOUd0NHFJZHlhQlR3endab25YT09iM0E1WkdFNSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5Mjk1X3FyU3M2ZHl2OVouanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206193),
('IPZ9c0tT5vJVL2JfkDwDNRdua3B7TVBdM2JpcTKS', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoieEJ5MnVFSVA2d3pEYWlrYVg3TDZncVBLblN0SlRsZkdpZkxJdWg3UyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjIzX0lVaWZ1NEo0VDYuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206194),
('y9pTyfTd4bW8qVOULP9X7R9LxbUC9NXmq0a6K5nR', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiRm5JcVBPNzJLbUFlNHhMV05kazlDdkpYU0RaMVpHUFZoTEpNNmlFcSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjgzX2FjRzM4WGZydEEuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206194),
('Zd3vCW8pSpsSQE5vhhyx85XkhJA5hJGUxQBkMYgS', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiNmhBMFhydERvOWhRTFlxMDAwbWp2WGFBMDh3amhWMXJHbFBVaE1ONSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjA4X0FxbDZ1M205RzQuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206194),
('3a6nvBmbY6vrFbShtXpyU8rRkZHUU8rishyWIMes', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiM3JxNFcwemNuY2luUDRXMTB1Ukc5Ylp4RGJVNFhkUUhQUDRzZWZ6bCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MjM3X0hEeHdEY1VqNTguanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206194),
('GgUHjitLpMNLDnBIMdVnLoQdZA4dt0ywG9sK3jSn', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiYk1Wc1hqWXVselVua2Jhc3JDM2FseTM2eEhPeDlSUmRHa1J0c2lwYyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTk0X0F2c2NOdjk3MEQuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206194),
('tdMVevRj8vbzZSCmwNSRXUBbY1uIPh9oZYn5N249', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiS2c3aVFaejRXZmtJU0tIR0h1SW5KcUhsUW1JYVlFazdXV1Z1a3dLWiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTMyX3Vtd1d3NDZFQUguanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206195),
('SonkTVtbI4KKEn0iLBik3OPlYuOGq00EuybzbMcT', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiT3ZFV21XdzlsVHJNVnpXbmk1VWd4MUVxZGZhVXMyREllbk1SSlQ5bSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTQ1X011RlExVXFlbU0uanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206195),
('yUUX7JP8Yt2NZRQsWdFzc5jZ1u9GHMMDKlc0mtFz', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidlA3SXhRcGI1dEs5VFhiMk8zSDNhdzJOanlqMmJQdEtHWmxFdVlCNCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTc3X2FWVUEwSHJseHIuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206195),
('TdoxcBaEbvYwmEQrBIg4gnU0XYWsfqlNeIfSStB6', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWVhzenN4bTZ0YnNkWVMzanVNZG11QnRyWE82MkZNbjBDUkp5N3paRyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzczMjU5MTYwX1o2SlRaRDlLU0kuanBlZyI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpsVkg0M0tsbmJZbVNZY1c4Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776206195),
('aelIm6k0RzeGlWMosNn1mYtS4nNJr2RLLquyhHlx', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoidGNlUDRXdG1sc21Yd0toejhsN0ZZSjRSaXhYZkVvZWlrWUZ1NmZKNSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776207259),
('GwOMBqRcbySwnnVA4KaKpWcLPIz9ph0ly6qSjPaD', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiRUFoeHROeFcyUW1kWnRLSGRVSXV0V2pRNUtsQ1BQbzc1QnlOd1FsViI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NzU6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL3N0b3JhZ2UvdXBsb2Fkcy8xNzY3MTIyNzc5X3Z1NTZqUldoZWUuanBlZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776207810),
('9bnE0BXk1iIrkDq5JggwWl5xwx4AdVBIZ9CpuaAY', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoieXU4ZTdBRThYQnpTM0dhNU1qNGRpd2lJUkRESFJ5NktCczhEc3NEdyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvZmVtYWxlLWljb24ucG5nIjtzOjU6InJvdXRlIjtOO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776208648),
('rCb6KKXkLtLeYSd5pt6AfJgzO0QIXaHMCyFcBtej', NULL, '102.205.85.35', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMTAycTJtb3ZycDFXUVRBaEcySExsZVRScG1lU1dycmszUTBmM09xRCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776208648),
('RW3kuBQLW6dUev1slc8hMjThf8r7JU6xHADKe6u1', NULL, '64.137.136.23', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZFBBU0dkYkpuUlhYcnJjelVXWG9QRzBBc1NnTkRYeWFsSnN4Yzk2ZSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6NjA6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlL2lsbHVzdHJhdGlvbnMvbWFsZS1pY29uLnBuZyI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776364630),
('608GHqFlDDEa6Fqw3CkOCEOtHsUF7BDBBFHsGiQ2', NULL, '66.132.172.176', 'Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoicEVxOGxvNk1BQjhoOGFyMVBTeUVvTklQaDZ1S1FTWHdGMm9LMGxmNCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlIjtzOjU6InJvdXRlIjtzOjI3OiJnZW5lcmF0ZWQ6OlgwU2kyclo1UU5MMDhiaFUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776410535),
('pxXqm5tRGgaFZcvCQ8LAWQw5dU6GIffQKyGE7ywv', NULL, '66.132.172.222', 'Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiV01kU2g4V2ZzZjZlaThwNUszZHpjbzdMV0ptak1RcXp1eGtiRlhOUyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly9hcGktZG50d2VkLm9ranRlY2guY28ua2UiO3M6NToicm91dGUiO3M6Mjc6ImdlbmVyYXRlZDo6WDBTaTJyWjVRTkwwOGJoVSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1776419291),
('iSR0ajOiemj5D4jp1QSCA5hZjC5NUHDNo2P8xLLU', NULL, '167.94.146.48', 'Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiU1JVcG81bWhJVmlzVFprTnE2VUF3MXpJaE1rbnI0QWh6dkgwdTlJYSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzU6Imh0dHA6Ly93d3cuYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlIjtzOjU6InJvdXRlIjtzOjI3OiJnZW5lcmF0ZWQ6OlgwU2kyclo1UU5MMDhiaFUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776433493),
('W8R19Qo3NJ5fx6EyhCVQDkbNsfK7UTgEbXfYZGEX', NULL, '199.45.155.85', 'Mozilla/5.0 (compatible; CensysInspect/1.1; +https://about.censys.io/)', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiMUt6bzhQc1NmNktPMm80U0hNTk9HZm44aVBwTFNDNm5oUk1jWlVhQiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzY6Imh0dHBzOi8vd3d3LmFwaS1kbnR3ZWQub2tqdGVjaC5jby5rZSI7czo1OiJyb3V0ZSI7czoyNzoiZ2VuZXJhdGVkOjpYMFNpMnJaNVFOTDA4YmhVIjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1776433688),
('UtU2hqPexRaJOKZ6B9xGkMgdFvZOIkXpnVmlBw4P', NULL, '37.72.140.3', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.90 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoielR1cll6enZpcHNpNjFtUmtsOW1nek9IMlJJakNQNnUxUFl1ZTNUTCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzE6Imh0dHA6Ly9hcGktZG50d2VkLm9ranRlY2guY28ua2UiO3M6NToicm91dGUiO3M6Mjc6ImdlbmVyYXRlZDo6WDBTaTJyWjVRTkwwOGJoVSI7fXM6NjoiX2ZsYXNoIjthOjI6e3M6Mzoib2xkIjthOjA6e31zOjM6Im5ldyI7YTowOnt9fX0=', 1776612779),
('JsbYkiOugbTsO1koenVa20uorKvAKc2w21IGAekt', NULL, '3.18.186.238', 'visionheight.com/scan Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWWZUQ1FZWWJVYndabWhlZm9zdHBHUTdsMUVCYlhETFFDU3FmdDhtMiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MzI6Imh0dHBzOi8vYXBpLWRudHdlZC5va2p0ZWNoLmNvLmtlIjtzOjU6InJvdXRlIjtzOjI3OiJnZW5lcmF0ZWQ6OlgwU2kyclo1UU5MMDhiaFUiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX19', 1776740547);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` bigint UNSIGNED NOT NULL,
  `key` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `group` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`, `group`, `created_at`, `updated_at`) VALUES
(1, 'wedding_date', '2025-06-15', 'general', '2025-12-30 16:25:26', '2026-04-03 07:04:41'),
(2, 'rsvp_enabled', 'true', 'general', '2025-12-30 16:25:26', '2026-04-03 07:04:41'),
(3, 'venue_name', 'Rosewood Manor', 'general', '2025-12-30 16:25:26', '2026-04-03 07:04:41'),
(4, 'admin_email_notifications', 'true', 'notifications', '2025-12-30 16:25:26', '2026-02-09 03:37:42'),
(5, 'invitation_theme', '{\"bgImage\":\"/uploads/1777319586_sYncZLpsGd.jpg\",\"accentColor\":\"#2C3E50\",\"content\":{\"en\":{\"title\":\"Dinah &  Tze Ren\",\"message\":\"RSVP by entering your code at: https://dntwed.okjtech.co.ke/\",\"final_1770370296700\":\"November 14th 2026\",\"loc_1770370754821\":\"Zereniti House, Limuru, Kenya\",\"final_1773267844947\":\"A day of love, a lifetime of memories.  We can’t wait to celebrate  with you.\",\"final_1773269000258\":\"invite to follow\"},\"zh\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"我们诚挚地邀请您参加我们的婚礼\"},\"ms\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"Kami menjemput anda untuk meraikan perkahwinan kami\"},\"luo\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"Wakwayi mondo ibe kodo e harus\"}},\"showIllustrations\":false,\"overlayOpacity\":90,\"showBorder\":true,\"orientation\":\"landscape\",\"frame\":{\"visible\":false,\"color\":\"#ffd700\",\"thickness\":1,\"padding\":0},\"showOuterOutline\":true,\"items\":[{\"id\":\"1773267806096\",\"type\":\"rsvp_code\",\"x\":417.3,\"y\":406.7,\"width\":129,\"height\":55,\"zIndex\":60},{\"id\":\"final_1773267844947\",\"type\":\"text\",\"x\":312.526,\"y\":101.34,\"width\":293,\"height\":55,\"zIndex\":59,\"textKey\":\"final_1773267844947\",\"fontStyle\":\"serif\",\"fontSize\":15,\"italic\":true,\"opacity\":100,\"color\":\"#000000\",\"rotate\":0.0548743},{\"id\":\"loc_1770370754821\",\"type\":\"text\",\"x\":312.6,\"y\":170,\"width\":293,\"height\":40,\"zIndex\":53,\"textKey\":\"loc_1770370754821\",\"fontStyle\":\"cursive\",\"fontSize\":25,\"color\":\"#000000\",\"opacity\":100},{\"id\":\"final_1770370296700\",\"type\":\"text\",\"x\":327,\"y\":259.2,\"width\":293,\"height\":40,\"zIndex\":52,\"textKey\":\"final_1770370296700\",\"fontStyle\":\"serif\",\"fontSize\":24,\"italic\":true,\"color\":\"#000000\"},{\"id\":\"title_1\",\"type\":\"text\",\"textKey\":\"title\",\"x\":252.267,\"y\":27.5,\"width\":294,\"height\":58,\"fontStyle\":\"cursive\",\"fontSize\":38,\"zIndex\":50,\"textAlign\":\"center\",\"verticalAlign\":\"middle\",\"color\":\"#000000\"},{\"id\":\"message_1\",\"type\":\"text\",\"x\":370.8,\"y\":326.7,\"width\":221,\"height\":80,\"zIndex\":25,\"textKey\":\"message\",\"fontStyle\":\"serif\",\"fontSize\":17,\"letterSpacing\":0,\"verticalAlign\":\"middle\"}],\"showGrid\":true,\"snapToGrid\":true,\"editorLang\":\"en\",\"fontStyle\":\"cursive\",\"fontSize\":95,\"letterSpacing\":0,\"overlayGradient\":true,\"overlayGradientStartPos\":0,\"overlayGradientEndColor\":\"#ffffff\",\"overlayGradientDirection\":\"to bottom\",\"overlayColor\":\"#ffffff\",\"overlayGradientStartTransparent\":true,\"overlayGradientEndTransparent\":false}', 'general', '2026-01-06 07:51:34', '2026-04-27 23:21:43'),
(6, 'notification_email', 'admin@wedding.com', 'notifications', '2026-02-09 03:37:42', '2026-02-09 03:37:42'),
(7, 'venue_address', 'Karen, Nairobi', 'general', '2026-02-09 03:37:42', '2026-02-09 03:37:42'),
(8, 'public_url', 'http://localhost/wed-dt/backend/public', 'general', '2026-02-09 03:37:42', '2026-04-03 07:04:41'),
(9, 'email_invitation_subject', 'You are invited to Dinah & Tze Ren\'s Wedding!', 'emails', '2026-02-09 04:06:05', '2026-04-29 17:34:28'),
(10, 'email_invitation_message', 'We are delighted to invite you to celebrate our wedding day. It would mean the world to us to have you there as we begin our new life together. RSVP by clicking below or at our website here:  https://dntwed.okjtech.co.ke/\nPlease RSVP by June 1, 2026.', 'emails', '2026-02-09 04:06:05', '2026-05-05 10:55:55'),
(11, 'email_rsvp_subject', 'RSVP Confirmation - Dinah & Tze Ren\'s Wedding', 'emails', '2026-02-09 04:06:05', '2026-02-09 04:06:05'),
(12, 'email_rsvp_attending_message', 'We\'re so excited you can make it! Thank you for confirming your attendance. We can\'t wait to share this special day with you!', 'emails', '2026-02-09 04:06:05', '2026-02-09 04:06:05'),
(13, 'email_rsvp_declined_message', 'We\'ll miss you! Thank you for letting us know. We understand you won\'t be able to join us, and we hope to celebrate with you another time.', 'emails', '2026-02-09 04:06:05', '2026-02-09 04:06:05'),
(14, 'email_gift_subject', 'Thank you for your gift! - Dinah & Tze Ren', 'emails', '2026-02-09 04:06:05', '2026-02-09 04:06:05'),
(15, 'email_gift_message', 'Thank you so much for your thoughtful gift and for being a part of our special day. Your generosity and kindness mean so much to us as we start our journey together.', 'emails', '2026-02-09 04:06:05', '2026-02-09 04:06:05'),
(16, 'save_the_date_theme', '{\"bgImage\":\"https://images.unsplash.com/photo-1550005814-49658ec2d825?auto=format&fit=crop&w=800&q=80\",\"accentColor\":\"#A67B5B\",\"content\":{\"en\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"Save the Date for our Wedding\",\"loc_1770660861629\":\"Nairobi, Kenya\",\"final_1770661030377\":\"invite to follow\"},\"zh\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"请保留我们的婚礼日期\"},\"ms\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"Simpan tarikh untuk perkahwinan kami\"},\"luo\":{\"title\":\"Dinah & Tze Ren\",\"message\":\"Wakwayi mondo iwer kodwa e harus\"}},\"showIllustrations\":false,\"overlayOpacity\":17,\"showBorder\":true,\"orientation\":\"landscape\",\"frame\":{\"visible\":true,\"thickness\":3,\"padding\":8,\"color\":\"#ceb5a1\"},\"showOuterOutline\":false,\"items\":[{\"id\":\"1770713918046\",\"type\":\"image\",\"x\":445.171,\"y\":-5.77333,\"width\":153,\"height\":166,\"zIndex\":60,\"src\":\"/uploads/1770713918_yo3SQ9uqE5.png\",\"rotate\":89.4963},{\"id\":\"1776201591656\",\"type\":\"image\",\"x\":50,\"y\":50,\"width\":100,\"height\":120,\"zIndex\":59,\"src\":\"/uploads/1776201625_4uqJregg1Q.jpeg\"},{\"id\":\"1776197191616\",\"type\":\"image\",\"x\":50,\"y\":50,\"width\":100,\"height\":120,\"zIndex\":58,\"src\":\"/uploads/1776197224_aaWOx0uVFE.jpeg\"},{\"id\":\"1770713872590\",\"type\":\"image\",\"x\":312,\"y\":0,\"width\":100,\"height\":120,\"zIndex\":56,\"src\":\"/uploads/1770713872_7qql3IT8wa.png\"},{\"id\":\"final_1770661030377\",\"type\":\"text\",\"x\":326,\"y\":417,\"width\":287,\"height\":40,\"zIndex\":55,\"textKey\":\"final_1770661030377\",\"fontStyle\":\"serif\",\"fontSize\":13,\"italic\":true},{\"id\":\"frame_1\",\"type\":\"frame\",\"x\":8,\"y\":8,\"width\":609,\"height\":484,\"color\":\"#ceb5a1\",\"thickness\":3,\"zIndex\":54},{\"id\":\"1770660946350\",\"type\":\"image\",\"x\":-0.5,\"y\":0,\"width\":328,\"height\":500,\"zIndex\":53,\"src\":\"/uploads/1770660946_490T2wzVnM.jpeg\"},{\"id\":\"loc_1770660861629\",\"type\":\"text\",\"x\":326.5,\"y\":332,\"width\":287,\"height\":40,\"zIndex\":52,\"textKey\":\"loc_1770660861629\",\"fontStyle\":\"cursive\",\"fontSize\":17,\"color\":\"#000000\"},{\"id\":\"1770660813715\",\"type\":\"calendar_link\",\"x\":326.5,\"y\":72,\"width\":287,\"height\":70,\"zIndex\":51},{\"id\":\"title_1\",\"type\":\"text\",\"textKey\":\"title\",\"x\":327.5,\"y\":120,\"width\":287,\"height\":132,\"fontStyle\":\"cursive\",\"fontSize\":40,\"zIndex\":50,\"color\":\"#000000\"},{\"id\":\"message_1\",\"type\":\"text\",\"textKey\":\"message\",\"x\":327,\"y\":207.5,\"width\":287,\"height\":51,\"fontStyle\":\"serif\",\"fontSize\":15,\"letterSpacing\":0,\"zIndex\":25}],\"showGrid\":true,\"snapToGrid\":true,\"editorLang\":\"en\",\"fontStyle\":\"cursive\",\"fontSize\":95,\"letterSpacing\":0}', 'general', '2026-02-09 15:16:08', '2026-04-14 18:33:14'),
(17, 'admin_email', 'admin@wedding.com', 'notifications', '2026-04-03 07:04:41', '2026-04-03 07:04:41'),
(18, 'settings', '{\"wedding_date\":\"2026-11-14\",\"rsvp_enabled\":\"true\",\"venue_name\":\"Zereniti House, Limuru, Kenya\",\"admin_email_notifications\":\"true\",\"admin_email\":\"admin@wedding.com\",\"public_url\":\"https:\\/\\/api-dntwed.okjtech.co.ke\",\"song_request_limit_enabled\":\"true\"}', 'general', '2026-04-03 07:09:52', '2026-04-14 20:19:53');

-- --------------------------------------------------------

--
-- Table structure for table `song_requests`
--

CREATE TABLE `song_requests` (
  `id` bigint UNSIGNED NOT NULL,
  `guest_name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `song_data` json NOT NULL,
  `song_title` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `artist` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_played` tinyint(1) NOT NULL DEFAULT '0',
  `played_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `song_requests`
--

INSERT INTO `song_requests` (`id`, `guest_name`, `song_data`, `song_title`, `artist`, `is_played`, `played_at`, `created_at`, `updated_at`) VALUES
(1, 'Kevin Tambo', '{\"id\": \"7EiZI6JVHllARrX9PUvAdX\", \"name\": \"Low Life (feat. The Weeknd)\", \"album\": \"EVOL\", \"image\": \"https://i.scdn.co/image/ab67616d000048512f62a05cc754995b544ec1f6\", \"artist\": \"Future, The Weeknd\", \"duration_ms\": 313546, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/7EiZI6JVHllARrX9PUvAdX\"}', 'Low Life (feat. The Weeknd)', 'Future, The Weeknd', 0, NULL, '2026-04-01 19:18:55', '2026-04-01 19:18:55'),
(13, 'Ifechukwude Obiago', '{\"id\": \"5uCax9HTNlzGybIStD3vDh\", \"name\": \"Say You Won\'t Let Go\", \"album\": \"Back from the Edge\", \"image\": \"https://i.scdn.co/image/ab67616d000048518d34e1fc21441df43571faaa\", \"artist\": \"James Arthur\", \"duration_ms\": 211477, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/5uCax9HTNlzGybIStD3vDh\"}', 'Say You Won\'t Let Go', 'James Arthur', 0, NULL, '2026-05-18 01:24:28', '2026-05-18 01:24:28'),
(14, 'Nabeela Merchant', '{\"id\": \"0PDCewmZCp0P5s00bptcdd\", \"name\": \"This Will Be (An Everlasting Love)\", \"album\": \"Inseparable\", \"image\": \"https://i.scdn.co/image/ab67616d0000485179e5e2b1860079d662a9bb76\", \"artist\": \"Natalie Cole\", \"duration_ms\": 171960, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/0PDCewmZCp0P5s00bptcdd\"}', 'This Will Be (An Everlasting Love)', 'Natalie Cole', 0, NULL, '2026-05-18 23:05:41', '2026-05-18 23:05:41'),
(4, 'Tze Ren Tang', '{\"id\": \"2cGxRwrMyEAp8dEbuZaVv6\", \"name\": \"Instant Crush (feat. Julian Casablancas)\", \"album\": \"Random Access Memories\", \"image\": \"https://i.scdn.co/image/ab67616d000048519b9b36b0e22870b9f542d937\", \"artist\": \"Daft Punk, Julian Casablancas\", \"duration_ms\": 337560, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/2cGxRwrMyEAp8dEbuZaVv6\"}', 'Instant Crush (feat. Julian Casablancas)', 'Daft Punk, Julian Casablancas', 0, NULL, '2026-04-29 17:44:36', '2026-04-29 17:44:36'),
(11, 'Chelsea Urquico', '{\"id\": \"1ko2lVN0vKGUl9zrU0qSlT\", \"name\": \"Just the Two of Us (feat. Bill Withers)\", \"album\": \"Anthology\", \"image\": \"https://i.scdn.co/image/ab67616d00004851472fbc1d5743c7d3c75b9ec0\", \"artist\": \"Grover Washington, Jr., Bill Withers\", \"duration_ms\": 438493, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/1ko2lVN0vKGUl9zrU0qSlT\"}', 'Just the Two of Us (feat. Bill Withers)', 'Grover Washington, Jr., Bill Withers', 0, NULL, '2026-05-14 17:12:31', '2026-05-14 17:12:31'),
(6, 'Miqdaad Fatakdawala', '{\"id\": \"0SzvmWfOhoxZVGrmvb56YL\", \"name\": \"Baby I\'m Yours\", \"album\": \"Leave Before The Lights Come On\", \"image\": \"https://i.scdn.co/image/ab67616d00004851fc5f23d71de7ad824565f94c\", \"artist\": \"Arctic Monkeys\", \"duration_ms\": 152613, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/0SzvmWfOhoxZVGrmvb56YL\"}', 'Baby I\'m Yours', 'Arctic Monkeys', 0, NULL, '2026-05-06 16:07:08', '2026-05-06 16:07:08'),
(12, 'Bhavesh Kakwani', '{\"id\": \"47eSFHsPDVJwssTTG62Af3\", \"name\": \"Lost in Music - 1995 Remaster\", \"album\": \"We Are Family (1995 Remaster)\", \"image\": \"https://i.scdn.co/image/ab67616d00004851f66d92378b233aa8253e71d2\", \"artist\": \"Sister Sledge\", \"duration_ms\": 287440, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/47eSFHsPDVJwssTTG62Af3\"}', 'Lost in Music - 1995 Remaster', 'Sister Sledge', 0, NULL, '2026-05-14 20:39:10', '2026-05-14 20:39:10'),
(8, 'Toristyemi Ugbeye', '{\"id\": \"7HBAWVHg5McCPRfHG5VFM4\", \"name\": \"Twin Flame\", \"album\": \"Vacancy\", \"image\": \"https://i.scdn.co/image/ab67616d00004851ae0e4f8f23556658c997d8c7\", \"artist\": \"Ari Lennox\", \"duration_ms\": 186089, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/7HBAWVHg5McCPRfHG5VFM4\"}', 'Twin Flame', 'Ari Lennox', 0, NULL, '2026-05-07 12:26:39', '2026-05-07 12:26:39'),
(9, 'Jasper Johar', '{\"id\": \"6LKeLk5IBQUb9eoXidchGQ\", \"name\": \"Clarks\", \"album\": \"Stronger We Get\", \"image\": \"https://i.scdn.co/image/ab67616d0000485167e6366c4eb98b1b1008e988\", \"artist\": \"Vybz Kartel, Popcaan, Gaza Slim\", \"duration_ms\": 183893, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/6LKeLk5IBQUb9eoXidchGQ\"}', 'Clarks', 'Vybz Kartel, Popcaan, Gaza Slim', 0, NULL, '2026-05-07 13:24:57', '2026-05-07 13:24:57'),
(10, 'Jeff Adam Richard Emmanuel', '{\"id\": \"0XP4jb9IjvliEXDt8rK3XY\", \"name\": \"Amor\", \"album\": \"Amor\", \"image\": \"https://i.scdn.co/image/ab67616d00004851b44b3dc169e48f7ecfd8bef3\", \"artist\": \"San Pacho\", \"duration_ms\": 155714, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/0XP4jb9IjvliEXDt8rK3XY\"}', 'Amor', 'San Pacho', 0, NULL, '2026-05-07 13:54:38', '2026-05-07 13:54:38'),
(15, 'Petra Okinnaka', '{\"id\": \"5l2sIiSjXzn6cOLZW1k3r4\", \"name\": \"No One Like You - Deluxe\", \"album\": \"Gameover (Deluxe)\", \"image\": \"https://i.scdn.co/image/ab67616d00004851d56801e17294497c17756e9b\", \"artist\": \"P-Square\", \"duration_ms\": 268318, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/5l2sIiSjXzn6cOLZW1k3r4\"}', 'No One Like You - Deluxe', 'P-Square', 0, NULL, '2026-05-20 22:31:18', '2026-05-20 22:31:18'),
(16, 'Tze Ren Tang', '{\"id\": \"2cGxRwrMyEAp8dEbuZaVv6\", \"name\": \"Instant Crush (feat. Julian Casablancas)\", \"album\": \"Random Access Memories\", \"image\": \"https://i.scdn.co/image/ab67616d000048519b9b36b0e22870b9f542d937\", \"artist\": \"Daft Punk, Julian Casablancas\", \"duration_ms\": 337560, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/2cGxRwrMyEAp8dEbuZaVv6\"}', 'Instant Crush (feat. Julian Casablancas)', 'Daft Punk, Julian Casablancas', 0, NULL, '2026-05-21 21:09:04', '2026-05-21 21:09:04'),
(17, 'Ankita Puri', '{\"id\": \"0OXzyIutbMk24FfWmZqrzw\", \"name\": \"I Say A Little Prayer (with Pharrell Williams)\", \"album\": \"Sing 2 (Original Motion Picture Soundtrack)\", \"image\": \"https://i.scdn.co/image/ab67616d000048515551adb75cf7c4737f93ed1d\", \"artist\": \"Tori Kelly, Pharrell Williams\", \"duration_ms\": 129425, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/0OXzyIutbMk24FfWmZqrzw\"}', 'I Say A Little Prayer (with Pharrell Williams)', 'Tori Kelly, Pharrell Williams', 0, NULL, '2026-05-22 17:42:10', '2026-05-22 17:42:10'),
(18, 'Namrata Bhagia', '{\"id\": \"2GiJYvgVaD2HtM8GqD9EgQ\", \"name\": \"Electric Love\", \"album\": \"Dopamine\", \"image\": \"https://i.scdn.co/image/ab67616d00004851cc2cf912462d8ae4ef856434\", \"artist\": \"BØRNS\", \"duration_ms\": 218106, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/2GiJYvgVaD2HtM8GqD9EgQ\"}', 'Electric Love', 'BØRNS', 0, NULL, '2026-05-23 12:52:02', '2026-05-23 12:52:02'),
(19, 'Benita Foo', '{\"id\": \"36AWdhZIGLUTkWpJDhe7va\", \"name\": \"2 Become 1\", \"album\": \"Spice\", \"image\": \"https://i.scdn.co/image/ab67616d0000485163facc42e4a35eb3aa182b59\", \"artist\": \"Spice Girls\", \"duration_ms\": 241026, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/36AWdhZIGLUTkWpJDhe7va\"}', '2 Become 1', 'Spice Girls', 0, NULL, '2026-05-23 16:02:49', '2026-05-23 16:02:49'),
(20, 'Brandon Fitzgerald', '{\"id\": \"53vfuY2r8Eg1jRMkjY62QZ\", \"name\": \"Kuna Kuna\", \"album\": \"Kuna Kuna\", \"image\": \"https://i.scdn.co/image/ab67616d000048514a17ef77c3eb0c512f187c3e\", \"artist\": \"Vic West, Fathermoh, Savara, Brandy Maina, Thee Exit Band\", \"duration_ms\": 212897, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/53vfuY2r8Eg1jRMkjY62QZ\"}', 'Kuna Kuna', 'Vic West, Fathermoh, Savara, Brandy Maina, Thee Exit Band', 0, NULL, '2026-05-23 16:51:27', '2026-05-23 16:51:27'),
(21, 'Marc Reeves-Newson', '{\"id\": \"0KoNztxLTujrZRxWiQGgBs\", \"name\": \"Home For A Rest\", \"album\": \"Save This House\", \"image\": \"https://i.scdn.co/image/ab67616d0000485116bca257d67471a04a29d0be\", \"artist\": \"Spirit Of The West\", \"duration_ms\": 276173, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/0KoNztxLTujrZRxWiQGgBs\"}', 'Home For A Rest', 'Spirit Of The West', 0, NULL, '2026-05-24 22:59:33', '2026-05-24 22:59:33'),
(22, 'Jasmine Khurana', '{\"id\": \"0zGLlXbHlrAyBN1x6sY0rb\", \"name\": \"A Sunday Kind Of Love\", \"album\": \"At Last!\", \"image\": \"https://i.scdn.co/image/ab67616d00004851b2229a8fdf377abaf3652624\", \"artist\": \"Etta James\", \"duration_ms\": 196133, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/0zGLlXbHlrAyBN1x6sY0rb\"}', 'A Sunday Kind Of Love', 'Etta James', 0, NULL, '2026-05-26 10:02:20', '2026-05-26 10:02:20'),
(23, 'Natalie Ploccienik', '{\"id\": \"3FtYbEfBqAlGO46NUDQSAt\", \"name\": \"Electric Feel\", \"album\": \"Oracular Spectacular\", \"image\": \"https://i.scdn.co/image/ab67616d000048518b32b139981e79f2ebe005eb\", \"artist\": \"MGMT\", \"duration_ms\": 229640, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/3FtYbEfBqAlGO46NUDQSAt\"}', 'Electric Feel', 'MGMT', 0, NULL, '2026-05-26 15:14:32', '2026-05-26 15:14:32'),
(24, 'Nilesh Pandey', '{\"id\": \"1tEto4JrqNmBZFH5uAiYqb\", \"name\": \"Sadi Gali\", \"album\": \"Tanu Weds Manu\", \"image\": \"https://i.scdn.co/image/ab67616d0000485188cd0451da5de305f16ae6f9\", \"artist\": \"Lehmber Hussainpuri, Raj Shekhar\", \"duration_ms\": 264900, \"preview_url\": null, \"spotify_url\": \"https://open.spotify.com/track/1tEto4JrqNmBZFH5uAiYqb\"}', 'Sadi Gali', 'Lehmber Hussainpuri, Raj Shekhar', 0, NULL, '2026-06-02 11:32:43', '2026-06-02 11:32:43');

-- --------------------------------------------------------

--
-- Table structure for table `tables`
--

CREATE TABLE `tables` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL DEFAULT '10',
  `x` int NOT NULL DEFAULT '0',
  `y` int NOT NULL DEFAULT '0',
  `width` int NOT NULL DEFAULT '100',
  `height` int NOT NULL DEFAULT '100',
  `type` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'round',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tables`
--

INSERT INTO `tables` (`id`, `name`, `capacity`, `x`, `y`, `width`, `height`, `type`, `created_at`, `updated_at`) VALUES
(1, 'Family', 5, 100, 100, 100, 100, 'round', '2026-01-20 04:20:20', '2026-01-20 04:20:20'),
(2, 'Friends', 5, 100, 100, 100, 100, 'round', '2026-01-20 04:20:29', '2026-01-20 04:20:29'),
(3, 'Colleagues', 5, 100, 100, 100, 100, 'round', '2026-01-20 04:20:42', '2026-01-20 04:20:42');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `two_factor_secret` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `two_factor_recovery_codes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `two_factor_secret`, `two_factor_confirmed_at`, `two_factor_recovery_codes`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Wedding Admin', 'admin@wedding.com', NULL, '$2y$12$hlZilytgmF4J5II.tRq0NePNdZYI9KujFLRsZbIN.oVSqFlnguRvy', '3GS7OSHMIR5DT7GU', '2026-02-10 04:53:12', NULL, NULL, '2025-12-30 16:24:24', '2026-04-01 18:19:44'),
(2, 'Tze Ren Tang', 'tangtzeren@gmail.com', NULL, '$2y$12$tZLywjN5Bl3woDvkcHJL4.DTTTtF5v94iY4pGgcSGJUqVVNEfWWJO', NULL, NULL, NULL, NULL, '2026-04-02 09:36:21', '2026-04-02 09:36:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `faqs`
--
ALTER TABLE `faqs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gallery_items`
--
ALTER TABLE `gallery_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gifts`
--
ALTER TABLE `gifts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gift_claims`
--
ALTER TABLE `gift_claims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `gift_claims_gift_id_foreign` (`gift_id`),
  ADD KEY `gift_claims_guest_id_foreign` (`guest_id`);

--
-- Indexes for table `guestbook_entries`
--
ALTER TABLE `guestbook_entries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `guests`
--
ALTER TABLE `guests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `guests_unique_code_unique` (`unique_code`),
  ADD UNIQUE KEY `guests_email_unique` (`email`),
  ADD UNIQUE KEY `guests_qr_code_unique` (`qr_code`),
  ADD KEY `guests_table_id_foreign` (`table_id`),
  ADD KEY `guests_parent_guest_id_foreign` (`parent_guest_id`);

--
-- Indexes for table `invitations`
--
ALTER TABLE `invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invitations_guest_id_foreign` (`guest_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `live_updates`
--
ALTER TABLE `live_updates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `live_updates_schedule_item_id_foreign` (`schedule_item_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `model_has_permissions`
--
ALTER TABLE `model_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  ADD KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`);

--
-- Indexes for table `model_has_roles`
--
ALTER TABLE `model_has_roles`
  ADD PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  ADD KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_notifiable_type_notifiable_id_index` (`notifiable_type`,`notifiable_id`);

--
-- Indexes for table `page_contents`
--
ALTER TABLE `page_contents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `page_contents_section_key_unique` (`section_key`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `polaroid_images`
--
ALTER TABLE `polaroid_images`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`);

--
-- Indexes for table `role_has_permissions`
--
ALTER TABLE `role_has_permissions`
  ADD PRIMARY KEY (`permission_id`,`role_id`),
  ADD KEY `role_has_permissions_role_id_foreign` (`role_id`);

--
-- Indexes for table `schedule_items`
--
ALTER TABLE `schedule_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `schedule_items_event_id_foreign` (`event_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `settings_key_unique` (`key`);

--
-- Indexes for table `song_requests`
--
ALTER TABLE `song_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tables`
--
ALTER TABLE `tables`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `enquiries`
--
ALTER TABLE `enquiries`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `faqs`
--
ALTER TABLE `faqs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `gallery_items`
--
ALTER TABLE `gallery_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `gifts`
--
ALTER TABLE `gifts`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `gift_claims`
--
ALTER TABLE `gift_claims`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `guestbook_entries`
--
ALTER TABLE `guestbook_entries`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `guests`
--
ALTER TABLE `guests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `live_updates`
--
ALTER TABLE `live_updates`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `page_contents`
--
ALTER TABLE `page_contents`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `polaroid_images`
--
ALTER TABLE `polaroid_images`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedule_items`
--
ALTER TABLE `schedule_items`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `song_requests`
--
ALTER TABLE `song_requests`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `tables`
--
ALTER TABLE `tables`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
