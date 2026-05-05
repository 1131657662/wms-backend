-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: wms
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bill_config`
--

DROP TABLE IF EXISTS `bill_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `bill_type_code` varchar(50) NOT NULL COMMENT '绫诲瀷缂栫爜(inbound/outbound/customer_code/supplier_code/warehouse_code)',
  `bill_type_name` varchar(50) NOT NULL COMMENT '鍚嶇О',
  `prefix` varchar(20) NOT NULL COMMENT '鍗曞彿鍓嶇紑',
  `serial_rule` varchar(20) NOT NULL COMMENT '瑙勫垯(date_seq/pure_seq)',
  `serial_digits` int NOT NULL COMMENT '搴忓彿浣嶆暟',
  `serial_start` int DEFAULT '1' COMMENT '璧峰?鍊',
  `is_enabled` tinyint DEFAULT '1' COMMENT '鍚?敤',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍗曟嵁閰嶇疆琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_config`
--

LOCK TABLES `bill_config` WRITE;
/*!40000 ALTER TABLE `bill_config` DISABLE KEYS */;
INSERT INTO `bill_config` VALUES (1,'inbound','入库订单','IN','date_seq',3,1,1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(2,'outbound','出库订单','OUT','date_seq',3,1,1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(3,'customer_code','客户编码','CUST','pure_seq',6,1,1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(4,'supplier_code','供应商编码','SUPP','pure_seq',6,1,1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(5,'warehouse_code','仓库编码','WH','pure_seq',3,1,1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(6,'check','盘点单','PD','date_seq',4,1,1,NULL,'2026-04-30 22:16:53',NULL,'2026-04-30 22:16:53',0);
/*!40000 ALTER TABLE `bill_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_serial`
--

DROP TABLE IF EXISTS `bill_serial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_serial` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `bill_type_code` varchar(50) NOT NULL COMMENT '鍗曟嵁绫诲瀷',
  `date_str` varchar(8) NOT NULL COMMENT '鏃ユ湡yyyyMMdd锛坧ure_seq鏃跺彲涓?0000000锛',
  `serial_no` int NOT NULL DEFAULT '0' COMMENT '褰撳墠搴忓彿',
  `lock_version` int DEFAULT '0' COMMENT '涔愯?閿佺増鏈?彿',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_date` (`bill_type_code`,`date_str`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍗曞彿娴佹按琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_serial`
--

LOCK TABLES `bill_serial` WRITE;
/*!40000 ALTER TABLE `bill_serial` DISABLE KEYS */;
INSERT INTO `bill_serial` VALUES (2,'inbound','20260430',16,15,NULL,'2026-04-30 11:02:33',NULL,'2026-04-30 14:02:49',0),(3,'warehouse_code','00000000',18,17,NULL,'2026-04-30 11:46:32',NULL,'2026-04-30 13:48:08',0),(4,'supplier_code','00000000',8,7,NULL,'2026-04-30 11:47:06',NULL,'2026-04-30 13:48:13',0),(5,'customer_code','00000000',9,8,NULL,'2026-04-30 11:48:16',NULL,'2026-04-30 13:48:28',0),(6,'check','20260430',1,1,NULL,'2026-04-30 22:17:05',NULL,'2026-04-30 14:48:16',0),(7,'outbound','20260501',4,3,NULL,'2026-04-30 16:44:12',NULL,'2026-05-01 01:43:42',0),(8,'inbound','20260501',4,3,NULL,'2026-05-01 04:32:22',NULL,'2026-05-01 10:13:29',0);
/*!40000 ALTER TABLE `bill_serial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `customer_code` varchar(50) NOT NULL COMMENT '缂栫爜锛堝敮涓?級',
  `customer_name` varchar(100) NOT NULL COMMENT '鍚嶇О',
  `address` varchar(200) DEFAULT NULL COMMENT '鍦板潃',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '鑱旂郴浜',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '鐢佃瘽',
  `credit_limit` decimal(12,2) DEFAULT NULL COMMENT '淇＄敤棰濆害',
  `customer_level` varchar(20) DEFAULT NULL COMMENT '绛夌骇(A/B/C)',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customer_code` (`customer_code`),
  UNIQUE KEY `uk_customer_name` (`customer_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='瀹㈡埛琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'CUST000001','示例建筑公司','XX省XX市XX区XX路100号','王五','13700003333',500000.00,'A',NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(5,'CUST000004','测试','','','',NULL,'A','admin','2026-04-30 13:10:06',NULL,'2026-04-30 13:10:06',0),(9,'CUST000008','测试1','测试','测试','测色',1.00,'A','admin','2026-04-30 13:48:28',NULL,'2026-04-30 13:48:28',0);
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inbound_order`
--

DROP TABLE IF EXISTS `inbound_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbound_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `order_no` varchar(50) NOT NULL COMMENT '鍗曟嵁缂栧彿锛堝敮涓?級',
  `inbound_date` date DEFAULT NULL COMMENT '鍏ュ簱鏃ユ湡',
  `vehicle_no` varchar(50) DEFAULT NULL COMMENT '杞﹀彿',
  `container_no` varchar(50) DEFAULT NULL COMMENT '鏌滃彿',
  `remark` varchar(500) DEFAULT NULL COMMENT '澶囨敞',
  `warehouse_code` varchar(50) DEFAULT NULL COMMENT '浠撳簱缂栫爜',
  `bill_type_code` varchar(50) DEFAULT NULL COMMENT '鍗曟嵁绫诲瀷',
  `supplier_code` varchar(50) DEFAULT NULL COMMENT '渚涘簲鍟嗙紪鍙',
  `delivery_no` varchar(50) DEFAULT NULL COMMENT '鏉ヨ揣鍗曞彿',
  `order_status` varchar(20) DEFAULT 'draft' COMMENT '鐘舵?(draft/submit/audited/cancelled)',
  `audit_by` varchar(50) DEFAULT NULL COMMENT '瀹℃牳浜',
  `audit_time` datetime DEFAULT NULL COMMENT '瀹℃牳鏃堕棿',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  `lock_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍏ュ簱璁㈠崟涓昏〃';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inbound_order`
--

LOCK TABLES `inbound_order` WRITE;
/*!40000 ALTER TABLE `inbound_order` DISABLE KEYS */;
INSERT INTO `inbound_order` VALUES (3,'IN20260430001','2026-04-30','测试','','测试','WH001',NULL,'SUPP000001','测试','submit',NULL,NULL,'admin','2026-04-30 11:02:33',NULL,'2026-04-30 11:02:33',0,0),(4,'IN20260430002','2026-04-30','测试','','','WH001',NULL,'SUPP000001','','audited','admin','2026-04-30 11:54:31','admin','2026-04-30 11:54:24','admin','2026-04-30 22:37:32',0,0),(5,'IN20260430003','2026-04-30','测试','','','WH010',NULL,'SUPP000004','','submit',NULL,NULL,'admin','2026-04-30 12:48:44','admin','2026-04-30 12:48:51',0,0),(6,'IN20260430004','2026-04-30','测试22','','','WH009',NULL,'SUPP000004','','submit',NULL,NULL,'admin','2026-04-30 12:49:59','admin','2026-04-30 12:50:04',0,0),(7,'IN20260430005','2026-04-30','测是','','','WH010',NULL,'SUPP000003','','submit',NULL,NULL,'admin','2026-04-30 12:50:50',NULL,'2026-04-30 12:50:50',0,0),(8,'IN20260430009','2026-04-30','测试1','','','WH012',NULL,'SUPP000005','','submit',NULL,NULL,'admin','2026-04-30 13:11:50','admin','2026-04-30 13:34:12',0,0),(9,'IN20260430008','2026-04-30','测试1','','','WH012',NULL,'SUPP000005','','submit',NULL,NULL,'admin','2026-04-30 13:15:13',NULL,'2026-04-30 13:15:13',0,0),(10,'IN20260430010','2026-04-30','测试1','','','WH014',NULL,'SUPP000006','','submit',NULL,NULL,'admin','2026-04-30 13:34:29','admin','2026-04-30 13:34:32',0,0),(11,'IN20260430011','2026-04-30','测试1','','','WH014',NULL,'SUPP000006','','submit',NULL,NULL,'admin','2026-04-30 13:36:36',NULL,'2026-04-30 13:36:36',0,0),(12,'IN20260430012','2026-04-30','测试1','','','WH014',NULL,'SUPP000006','','audited','admin','2026-05-01 10:13:11','admin','2026-04-30 13:36:44','admin','2026-05-01 10:13:11',0,1),(13,'IN20260430013','2026-04-30','测试1','','','WH014',NULL,'SUPP000006','','submit',NULL,NULL,'admin','2026-04-30 13:38:20','admin','2026-04-30 15:40:57',0,0),(14,'IN20260430014','2026-04-30','浙B123456','测试测试','测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试','WH017',NULL,'SUPP000003','测试测试','audited','admin','2026-04-30 15:23:31','admin','2026-04-30 13:53:25','admin','2026-04-30 15:23:31',0,0),(15,'IN20260430015','2026-04-30','浙B123456','','测试','WH017',NULL,'SUPP000003','','audited','admin','2026-04-30 14:02:53','admin','2026-04-30 14:02:47','admin','2026-04-30 14:02:53',0,0),(16,'IN20260501001','2026-05-01','浙B123456','','','WH017','采购入库','SUPP000001','','audited','admin','2026-05-01 04:32:40','admin','2026-05-01 04:32:22','admin','2026-05-01 04:32:40',0,1),(17,'IN20260501002','2026-05-01','浙B123456','','','WH017','采购入库','SUPP000001','','audited','admin','2026-05-01 05:01:06','admin','2026-05-01 05:00:40','admin','2026-05-01 05:01:06',0,1),(18,'IN20260501003','2026-05-01','浙B123456','','','WH017','采购入库','SUPP000001','','submit',NULL,NULL,'admin','2026-05-01 10:13:29',NULL,'2026-05-01 10:13:29',0,0);
/*!40000 ALTER TABLE `inbound_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inbound_order_detail`
--

DROP TABLE IF EXISTS `inbound_order_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbound_order_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `uuid` varchar(50) NOT NULL COMMENT '鍞?竴鏍囪瘑',
  `order_no` varchar(50) NOT NULL COMMENT '鍏宠仈涓昏〃缂栧彿',
  `product_code` varchar(50) NOT NULL COMMENT '浜у搧缂栫爜',
  `product_name` varchar(100) DEFAULT NULL COMMENT '浜у搧鍚嶇О锛堝啑浣欙級',
  `product_model` varchar(100) DEFAULT NULL COMMENT '鍨嬪彿锛堝啑浣欙級',
  `inbound_weight` decimal(12,3) DEFAULT NULL COMMENT '鍏ュ簱鍚ㄤ綅',
  `inbound_qty` int DEFAULT NULL COMMENT '鍏ュ簱浠舵暟',
  `detail_remark` varchar(200) DEFAULT NULL COMMENT '鏄庣粏澶囨敞',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍏ュ簱璁㈠崟鏄庣粏琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inbound_order_detail`
--

LOCK TABLES `inbound_order_detail` WRITE;
/*!40000 ALTER TABLE `inbound_order_detail` DISABLE KEYS */;
INSERT INTO `inbound_order_detail` VALUES (4,'0a89b4a5-9fe2-4523-b6b6-85192510f726','IN20260430001','P001','示例螺纹钢','HRB400-16mm',0.001,1,'1','admin','2026-04-30 11:02:33',NULL,'2026-04-30 11:02:33',0),(5,'b474d5ea-fd59-41e6-89e7-7af100b95f49','IN20260430002','003','短纤','测试',0.001,1,'','admin','2026-04-30 11:54:24',NULL,'2026-04-30 11:54:24',0),(6,'ece76b1e-6878-4918-b7cd-a122b61b7fbc','DRAFT_5','007','007','006',0.002,1,'测试','admin','2026-04-30 12:48:44','admin','2026-04-30 12:48:51',1),(7,'9298e91a-3525-4c68-9ad9-821119adac7b','DRAFT_5','006','006','006',0.001,1,'','admin','2026-04-30 12:48:44','admin','2026-04-30 12:48:51',1),(8,'c570b940-5d80-4279-a068-4a68a6cf3ebd','DRAFT_5','009','009','009',0.001,1,'','admin','2026-04-30 12:48:44','admin','2026-04-30 12:48:51',1),(9,'cbc6f044-bf49-4b60-abcf-e99fbbe5753c','DRAFT_6','009','009','009',0.001,1,'','admin','2026-04-30 12:49:59','admin','2026-04-30 12:50:04',1),(10,'ab135981-6dc9-4989-86e0-22898b636ebe','IN20260430005','009','009','009',1.000,1,'','admin','2026-04-30 12:50:50',NULL,'2026-04-30 12:50:50',0),(11,'ff87aa09-d768-4d37-86ae-172af93079ce','DRAFT_8','100','009','009',0.001,1,'','admin','2026-04-30 13:11:50','admin','2026-04-30 13:34:12',1),(12,'5bb0ed23-f300-4c46-9872-357ab42fd9c4','DRAFT_8','100','009','009',0.001,1,'','admin','2026-04-30 13:11:50','admin','2026-04-30 13:34:12',1),(13,'ad3aa770-50d1-4de5-856a-8684845037fd','IN20260430008','101','100','100',0.001,1,'','admin','2026-04-30 13:15:13',NULL,'2026-04-30 13:15:13',0),(14,'ff87aa09-d768-4d37-86ae-172af93079ce','IN20260430009','100','009','009',0.001,1,'','admin','2026-04-30 13:34:12',NULL,'2026-04-30 13:34:12',0),(15,'5bb0ed23-f300-4c46-9872-357ab42fd9c4','IN20260430009','100','009','009',0.001,1,'','admin','2026-04-30 13:34:12',NULL,'2026-04-30 13:34:12',0),(16,'d_1_1777556055464','DRAFT_10','101','100','100',0.001,1,'','admin','2026-04-30 13:34:29','admin','2026-04-30 13:34:32',1),(17,'d_2_1777556063705','DRAFT_10','102','100','100',0.001,1,'','admin','2026-04-30 13:34:29','admin','2026-04-30 13:34:32',1),(18,'d_1_1777556055464','IN20260430010','101','100','100',0.001,1,'','admin','2026-04-30 13:34:32',NULL,'2026-04-30 13:34:32',0),(19,'d_2_1777556063705','IN20260430010','102','100','100',0.001,1,'','admin','2026-04-30 13:34:32',NULL,'2026-04-30 13:34:32',0),(20,'d_1_1777556187085','IN20260430011','102','100','100',0.001,1,'','admin','2026-04-30 13:36:36',NULL,'2026-04-30 13:36:36',0),(21,'d_1_1777556197358','IN20260430012','102','100','100',0.001,1,'','admin','2026-04-30 13:36:44',NULL,'2026-04-30 13:36:44',0),(22,'d_1_1777556293364','IN20260430013','100','009','009',0.001,1,'','admin','2026-04-30 13:38:20',NULL,'2026-04-30 13:38:20',0),(23,'d_1_1777557185178','IN20260430014','P001','示例螺纹钢','HRB400-16mm',1.000,1,'','admin','2026-04-30 13:53:25','admin','2026-04-30 15:23:13',1),(24,'d_1_1777557747935','DRAFT_15','102','102','102',0.001,1,'','admin','2026-04-30 14:02:47','admin','2026-04-30 14:02:49',1),(25,'d_2_1777557762406','DRAFT_15','102','102','102',0.001,1,'','admin','2026-04-30 14:02:47','admin','2026-04-30 14:02:49',1),(26,'d_1_1777557747935','IN20260430015','102','102','102',0.001,1,'','admin','2026-04-30 14:02:49',NULL,'2026-04-30 14:02:49',0),(27,'d_2_1777557762406','IN20260430015','102','102','102',0.001,1,'','admin','2026-04-30 14:02:49',NULL,'2026-04-30 14:02:49',0),(28,'d_1_1777557185178','IN20260430014','P001','示例螺纹钢','HRB400-16mm',2.000,2,'','admin','2026-04-30 15:23:13',NULL,'2026-04-30 15:23:13',0),(29,'d_1_1777609930945','IN20260501001','101','100','100',1.000,1,'','admin','2026-05-01 04:32:22',NULL,'2026-05-01 04:32:22',0),(30,'d_1_1777611631846','IN20260501002','101','100','100',1.000,1,'','admin','2026-05-01 05:00:40',NULL,'2026-05-01 05:00:40',0),(31,'d_1_1777630396312','IN20260501003','101','100','100',1.000,1,'','admin','2026-05-01 10:13:29',NULL,'2026-05-01 10:13:29',0);
/*!40000 ALTER TABLE `inbound_order_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_order`
--

DROP TABLE IF EXISTS `outbound_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_order` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `order_no` varchar(50) NOT NULL COMMENT '鍗曟嵁缂栧彿锛堝敮涓?級',
  `outbound_date` date DEFAULT NULL COMMENT '鍑哄簱鏃ユ湡',
  `vehicle_no` varchar(50) DEFAULT NULL COMMENT '杞﹀彿',
  `container_no` varchar(50) DEFAULT NULL COMMENT '鏌滃彿',
  `remark` varchar(500) DEFAULT NULL COMMENT '澶囨敞',
  `warehouse_code` varchar(50) DEFAULT NULL COMMENT '浠撳簱缂栫爜',
  `bill_type_code` varchar(50) DEFAULT NULL COMMENT '鍗曟嵁绫诲瀷',
  `customer_code` varchar(50) DEFAULT NULL COMMENT '瀹㈡埛缂栫爜',
  `customer_name` varchar(100) DEFAULT NULL COMMENT '瀹㈡埛鍚嶇О锛堝啑浣欙級',
  `customer_address` varchar(200) DEFAULT NULL COMMENT '瀹㈡埛鍦板潃',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '鑱旂郴浜',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '鑱旂郴鐢佃瘽',
  `order_status` varchar(20) DEFAULT 'draft' COMMENT '鐘舵?(draft/submit/audited/cancelled)',
  `audit_by` varchar(50) DEFAULT NULL COMMENT '瀹℃牳浜',
  `audit_time` datetime DEFAULT NULL COMMENT '瀹℃牳鏃堕棿',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  `lock_version` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍑哄簱璁㈠崟涓昏〃';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_order`
--

LOCK TABLES `outbound_order` WRITE;
/*!40000 ALTER TABLE `outbound_order` DISABLE KEYS */;
INSERT INTO `outbound_order` VALUES (1,'OUT20260501001','2026-04-30','测试','','','WH017','销售出库','CUST000001','示例建筑公司','XX省XX市XX区XX路100号','王五','13700003333','audited','admin','2026-04-30 16:46:12','admin','2026-04-30 16:44:12','admin','2026-04-30 16:46:12',0,3),(2,'DRAFT_OUT_2','2026-05-01','浙B123456','','','WH017','销售出库','CUST000008','测试1','测试','测试','测色','draft',NULL,NULL,'admin','2026-05-01 01:41:18','admin','2026-05-01 01:41:34',1,0),(3,'OUT20260501002','2026-05-01','浙B123456','','','WH017','销售出库','CUST000008','测试1','测试','测试','测色','submit',NULL,NULL,'admin','2026-05-01 01:41:52','admin','2026-05-01 01:42:15',0,1),(4,'OUT20260501003','2026-05-01','测试1','','','WH017','销售出库','CUST000001','示例建筑公司','XX省XX市XX区XX路100号','王五','13700003333','submit',NULL,NULL,'admin','2026-05-01 01:43:42','admin','2026-05-01 01:44:26',0,2);
/*!40000 ALTER TABLE `outbound_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `outbound_order_detail`
--

DROP TABLE IF EXISTS `outbound_order_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbound_order_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `uuid` varchar(50) NOT NULL COMMENT '鍞?竴鏍囪瘑',
  `order_no` varchar(50) NOT NULL COMMENT '鍏宠仈涓昏〃缂栧彿',
  `product_code` varchar(50) NOT NULL COMMENT '浜у搧缂栫爜',
  `product_name` varchar(100) DEFAULT NULL COMMENT '浜у搧鍚嶇О锛堝啑浣欙級',
  `product_model` varchar(100) DEFAULT NULL COMMENT '鍨嬪彿锛堝啑浣欙級',
  `contract_no` varchar(50) DEFAULT NULL COMMENT '鍚堝悓鍙',
  `outbound_weight` decimal(12,3) DEFAULT NULL COMMENT '鍑哄簱鍚ㄤ綅',
  `outbound_qty` int DEFAULT NULL COMMENT '鍑哄簱浠舵暟',
  `detail_remark` varchar(200) DEFAULT NULL COMMENT '鏄庣粏澶囨敞',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍑哄簱璁㈠崟鏄庣粏琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `outbound_order_detail`
--

LOCK TABLES `outbound_order_detail` WRITE;
/*!40000 ALTER TABLE `outbound_order_detail` DISABLE KEYS */;
INSERT INTO `outbound_order_detail` VALUES (1,'d_1_1777567361486','OUT20260501001','P001','示例螺纹钢','HRB400-16mm','',1.000,1,'','admin','2026-04-30 16:44:12',NULL,'2026-04-30 16:44:12',0),(2,'d_1_1777599571326','DRAFT_OUT_2','101','100','100','',0.000,1,'','admin','2026-05-01 01:41:18','admin','2026-05-01 01:41:34',1),(3,'d_1_1777599696131','DRAFT_OUT_3','009','009','009','',1.000,1,'','admin','2026-05-01 01:41:52','admin','2026-05-01 01:42:15',1),(4,'d_1_1777599696131','OUT20260501002','009','009','009','',1.000,1,'','admin','2026-05-01 01:42:15',NULL,'2026-05-01 01:42:15',0),(5,'d_1_1777599803679','OUT20260501003','003','短纤','测试','',0.000,1,'','admin','2026-05-01 01:43:42','admin','2026-05-01 01:44:06',1),(6,'d_1_1777599803679','OUT20260501003','003','短纤','测试','',1.000,1,'','admin','2026-05-01 01:44:06','admin','2026-05-01 01:44:26',1),(7,'d_1_1777599803679','OUT20260501003','003','短纤','测试','',1.000,1,'','admin','2026-05-01 01:44:26',NULL,'2026-05-01 01:44:26',0);
/*!40000 ALTER TABLE `outbound_order_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `print_template`
--

DROP TABLE IF EXISTS `print_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `print_template` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `template_name` varchar(100) NOT NULL COMMENT '模板名称',
  `business_type` varchar(50) NOT NULL COMMENT '业务类型',
  `report_code` varchar(50) NOT NULL COMMENT '积木报表ID',
  `output_format` varchar(20) DEFAULT 'PDF' COMMENT '输出格式',
  `api_url` varchar(255) DEFAULT NULL COMMENT '积木报表API地址模板',
  `is_enabled` tinyint DEFAULT '1',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT ((now() + interval 8 hour)),
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT ((now() + interval 8 hour)),
  `del_flag` tinyint DEFAULT '0',
  `jimu_token` varchar(100) DEFAULT NULL COMMENT '积木报表认证token',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='打印模板配置表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `print_template`
--

LOCK TABLES `print_template` WRITE;
/*!40000 ALTER TABLE `print_template` DISABLE KEYS */;
INSERT INTO `print_template` VALUES (1,'出库单打印','outbound','1210092886356275200','PDF','http://localhost:8085/jmreport/exportReport',1,NULL,'2026-05-01 23:34:25',NULL,'2026-05-01 23:34:25',0,''),(2,'入库单打印','inbound','','PDF','http://localhost:8085/jmreport/exportReport',1,NULL,'2026-05-02 00:11:09',NULL,'2026-05-02 00:11:09',0,NULL);
/*!40000 ALTER TABLE `print_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `product_code` varchar(50) NOT NULL COMMENT '浜у搧缂栫爜锛堝敮涓?級',
  `product_name` varchar(100) NOT NULL COMMENT '浜у搧鍚嶇О',
  `product_model` varchar(100) DEFAULT NULL COMMENT '鍨嬪彿',
  `count_unit` varchar(20) DEFAULT NULL COMMENT '璁℃暟鍗曚綅',
  `weight_unit` varchar(20) DEFAULT NULL COMMENT '璁￠噸鍗曚綅',
  `package_type` varchar(50) DEFAULT NULL COMMENT '鍖呰?绫诲瀷',
  `package_color` varchar(50) DEFAULT NULL COMMENT '鍖呰?棰滆壊',
  `strap_color` varchar(50) DEFAULT NULL COMMENT '鍖呭甫棰滆壊',
  `category_id` bigint DEFAULT NULL COMMENT '鍒嗙被ID',
  `sale_price` decimal(10,2) DEFAULT NULL COMMENT '閿?敭鍙傝?浠',
  `cost_price` decimal(10,2) DEFAULT NULL COMMENT '鏈?繎鎴愭湰',
  `default_min_alert_weight` decimal(12,3) DEFAULT NULL,
  `default_max_alert_weight` decimal(12,3) DEFAULT NULL,
  `status` varchar(20) DEFAULT '姝ｅ父' COMMENT '鐘舵?锛堟?甯?鍋滅敤锛',
  `remark` varchar(500) DEFAULT NULL COMMENT '澶囨敞',
  `image_url` varchar(255) DEFAULT NULL COMMENT '鍥剧墖鍦板潃',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_code` (`product_code`),
  UNIQUE KEY `uk_product_model` (`product_model`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍟嗗搧琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'P001','示例螺纹钢','HRB400-16mm','件','吨','捆装','蓝色','白色',1,4200.00,3800.00,20.000,200.000,'正常','示例商品，用于开发测试',NULL,NULL,'2026-04-30 17:29:30','admin','2026-04-30 15:08:35',0),(2,'003','短纤','测试','包','吨','捆扎','','',3,NULL,NULL,20.000,200.000,'正常','','','admin','2026-04-30 11:46:07','admin','2026-04-30 15:08:38',0),(3,'004','测试','测试1','包','吨','捆扎','','',4,NULL,NULL,NULL,NULL,'正常','','','admin','2026-04-30 11:46:23',NULL,'2026-04-30 11:46:23',0),(4,'005','005','005','','','','','',NULL,NULL,NULL,NULL,NULL,'停用','','','admin','2026-04-30 11:47:56',NULL,'2026-04-30 11:47:56',0),(5,'','','','','','','','',NULL,NULL,NULL,NULL,NULL,'正常','','','admin','2026-04-30 11:50:11','admin','2026-04-30 12:35:38',1),(6,'006','006','006','包','吨','捆扎','','',3,NULL,NULL,NULL,NULL,'正常','','','admin','2026-04-30 12:35:50',NULL,'2026-04-30 12:35:50',0),(9,'009','009','009','包','吨','捆扎','','',3,NULL,NULL,NULL,NULL,'正常','','','admin','2026-04-30 12:36:29','admin','2026-04-30 12:37:51',0),(14,'101','100','100','','','','','',NULL,NULL,NULL,NULL,NULL,'正常','','','admin','2026-04-30 13:13:10',NULL,'2026-04-30 13:13:10',0),(22,'102','102','102','','','','','',NULL,NULL,NULL,NULL,NULL,'停用','','','admin','2026-04-30 13:43:30','admin','2026-04-30 15:49:37',0),(23,'TEST-LOG-001','��־������Ʒ','TEST',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'����',NULL,NULL,'admin','2026-05-01 04:54:33','admin','2026-05-01 04:57:05',1);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_category`
--

DROP TABLE IF EXISTS `product_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_category` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `category_name` varchar(50) NOT NULL,
  `parent_id` bigint DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_parent_category` (`parent_id`,`category_name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鍟嗗搧鍒嗙被琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_category`
--

LOCK TABLES `product_category` WRITE;
/*!40000 ALTER TABLE `product_category` DISABLE KEYS */;
INSERT INTO `product_category` VALUES (1,'原材料',0,1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(2,'成品',0,2,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(3,'腈纶',0,0,'admin','2026-04-30 11:04:11',NULL,'2026-04-30 11:04:11',0),(4,'短纤',3,0,'admin','2026-04-30 11:04:26',NULL,'2026-04-30 11:04:26',0),(5,'丝束',3,1,'admin','2026-04-30 11:04:37',NULL,'2026-04-30 11:04:37',0),(6,'',0,0,'admin','2026-04-30 11:50:04','admin','2026-04-30 11:50:07',1),(7,'测试',0,0,'admin','2026-04-30 12:35:16','admin','2026-04-30 13:05:41',1),(8,'测试1',7,0,'admin','2026-04-30 12:35:25',NULL,'2026-04-30 12:35:25',0),(9,'测试2',7,0,'admin','2026-04-30 12:35:30',NULL,'2026-04-30 12:35:30',0),(12,'1',3,0,'admin','2026-04-30 13:29:05','admin','2026-04-30 13:29:05',1);
/*!40000 ALTER TABLE `product_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_task`
--

DROP TABLE IF EXISTS `scheduled_task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_task` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cron_expression` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enabled` tinyint DEFAULT '1',
  `last_run_time` datetime DEFAULT NULL,
  `next_run_time` datetime DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `task_key` (`task_key`),
  UNIQUE KEY `task_key_2` (`task_key`),
  UNIQUE KEY `task_key_3` (`task_key`),
  UNIQUE KEY `task_key_4` (`task_key`),
  UNIQUE KEY `task_key_5` (`task_key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_task`
--

LOCK TABLES `scheduled_task` WRITE;
/*!40000 ALTER TABLE `scheduled_task` DISABLE KEYS */;
INSERT INTO `scheduled_task` VALUES (1,'库存预警检查','stock_alert_check','0 2 * * *','每日凌晨 2 点检查所有库存商品的库存吨位是否超出预警上下限',1,NULL,NULL,'2026-05-01 10:54:03','2026-05-01 10:54:03',0),(2,'数据库自动备份','auto_backup','30 2 * * *','每日凌晨 2:30 备份数据库，保留7天日备份+30天内周备份',1,NULL,NULL,'2026-05-01 11:19:08','2026-05-01 11:19:08',0);
/*!40000 ALTER TABLE `scheduled_task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_task_log`
--

DROP TABLE IF EXISTS `scheduled_task_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_task_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `task_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `task_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trigger_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'auto',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'running',
  `result_message` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_task_log`
--

LOCK TABLES `scheduled_task_log` WRITE;
/*!40000 ALTER TABLE `scheduled_task_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `scheduled_task_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `warehouse_code` varchar(50) NOT NULL COMMENT '浠撳簱缂栫爜',
  `warehouse_name` varchar(100) DEFAULT NULL COMMENT '浠撳簱鍚嶇О',
  `product_code` varchar(50) NOT NULL COMMENT '浜у搧缂栫爜',
  `product_name` varchar(100) DEFAULT NULL COMMENT '浜у搧鍚嶇О',
  `product_model` varchar(100) DEFAULT NULL COMMENT '鍨嬪彿',
  `stock_qty` int DEFAULT '0' COMMENT '搴撳瓨浠舵暟',
  `stock_weight` decimal(12,3) DEFAULT '0.000' COMMENT '搴撳瓨鍚ㄤ綅',
  `min_alert_weight` decimal(12,3) DEFAULT NULL COMMENT '鏈?綆棰勮?鍚ㄤ綅',
  `max_alert_weight` decimal(12,3) DEFAULT NULL COMMENT '鏈?珮棰勮?鍚ㄤ綅',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_product` (`warehouse_code`,`product_code`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='搴撳瓨琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (3,'WH005','测试2','003','短纤','测试',1,0.001,50.000,300.000,'admin','2026-04-30 11:54:31','admin','2026-04-30 15:01:06',0),(4,'WH017','测试12','102','102','102',2,0.002,50.000,300.000,'admin','2026-04-30 14:02:53','admin','2026-04-30 15:01:02',0),(5,'WH017','测试12','P001','示例螺纹钢','HRB400-16mm',1,1.000,50.000,300.000,'admin','2026-04-30 14:28:06','admin','2026-04-30 16:46:12',0),(6,'WH014','','100','009','009',0,0.000,20.000,200.000,'admin','2026-04-30 15:40:42','admin','2026-04-30 15:43:14',0),(12,'WH017','测试12','101','100','100',2,2.000,NULL,NULL,'admin','2026-05-01 04:32:40','admin','2026-05-01 05:01:06',0),(15,'WH014','','102','100','100',1,0.001,NULL,NULL,'admin','2026-05-01 10:13:11','admin','2026-05-01 10:13:11',0);
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_check_detail`
--

DROP TABLE IF EXISTS `stock_check_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_check_detail` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `check_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_model` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `before_qty` int DEFAULT '0',
  `before_weight` decimal(12,3) DEFAULT '0.000',
  `actual_qty` int DEFAULT '0',
  `actual_weight` decimal(12,3) DEFAULT '0.000',
  `diff_qty` int DEFAULT '0',
  `diff_weight` decimal(12,3) DEFAULT '0.000',
  `remark` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_check_no` (`check_no`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_check_detail`
--

LOCK TABLES `stock_check_detail` WRITE;
/*!40000 ALTER TABLE `stock_check_detail` DISABLE KEYS */;
INSERT INTO `stock_check_detail` VALUES (1,'PD202604300000','P001','示例螺纹钢','HRB400-16mm',1,1.000,1,1.000,0,0.000,'','admin','2026-04-30 14:48:16',NULL,'2026-04-30 14:48:16',0),(2,'PD202604300000','102','102','102',2,0.002,2,0.002,0,0.000,'','admin','2026-04-30 14:48:16',NULL,'2026-04-30 14:48:16',0);
/*!40000 ALTER TABLE `stock_check_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_check_order`
--

DROP TABLE IF EXISTS `stock_check_order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_check_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `check_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `warehouse_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `warehouse_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `remark` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audit_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `audit_time` datetime DEFAULT NULL,
  `create_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `check_no` (`check_no`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_check_order`
--

LOCK TABLES `stock_check_order` WRITE;
/*!40000 ALTER TABLE `stock_check_order` DISABLE KEYS */;
INSERT INTO `stock_check_order` VALUES (1,'PD202604300000','WH017','测试12','confirmed','',NULL,NULL,'admin','2026-04-30 14:48:16','admin','2026-04-30 14:48:27',0);
/*!40000 ALTER TABLE `stock_check_order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_journal`
--

DROP TABLE IF EXISTS `stock_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_journal` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `product_code` varchar(50) NOT NULL COMMENT '浜у搧缂栫爜',
  `product_name` varchar(100) DEFAULT NULL COMMENT '浜у搧鍚嶇О',
  `product_model` varchar(100) DEFAULT NULL COMMENT '鍨嬪彿',
  `warehouse_code` varchar(50) NOT NULL COMMENT '浠撳簱缂栫爜',
  `warehouse_name` varchar(100) DEFAULT NULL COMMENT '浠撳簱鍚嶇О',
  `business_type` varchar(20) NOT NULL COMMENT 'inbound/outbound/check',
  `order_no` varchar(50) DEFAULT NULL COMMENT '鍏宠仈鍗曟嵁鍙',
  `change_qty` int DEFAULT '0' COMMENT '鍙樺姩浠舵暟锛堟?鍏ヨ礋鍑猴級',
  `change_weight` decimal(12,3) DEFAULT '0.000' COMMENT '鍙樺姩鍚ㄤ綅',
  `before_qty` int DEFAULT '0' COMMENT '鍙樺姩鍓嶄欢鏁',
  `before_weight` decimal(12,3) DEFAULT '0.000' COMMENT '鍙樺姩鍓嶅惃浣',
  `after_qty` int DEFAULT '0' COMMENT '鍙樺姩鍚庝欢鏁',
  `after_weight` decimal(12,3) DEFAULT '0.000' COMMENT '鍙樺姩鍚庡惃浣',
  `remark` varchar(200) DEFAULT NULL COMMENT '澶囨敞',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_warehouse_product` (`warehouse_code`,`product_code`),
  KEY `idx_order_no` (`order_no`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='搴撳瓨娴佹按琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_journal`
--

LOCK TABLES `stock_journal` WRITE;
/*!40000 ALTER TABLE `stock_journal` DISABLE KEYS */;
INSERT INTO `stock_journal` VALUES (3,'003','短纤','测试','WH005','测试2','inbound','IN20260430002',1,0.001,0,0.000,1,0.001,NULL,'admin','2026-04-30 11:54:31',NULL,'2026-04-30 11:54:31',0),(4,'102','102','102','WH017','测试12','inbound','IN20260430015',1,0.001,0,0.000,1,0.001,NULL,'admin','2026-04-30 14:02:53',NULL,'2026-04-30 14:02:53',0),(5,'102','102','102','WH017','测试12','inbound','IN20260430015',1,0.001,1,0.001,2,0.002,NULL,'admin','2026-04-30 14:02:53',NULL,'2026-04-30 14:02:53',0),(6,'P001','示例螺纹钢','HRB400-16mm','WH017','测试12','inbound','IN20260430014',1,1.000,0,0.000,1,1.000,NULL,'admin','2026-04-30 14:28:06','admin','2026-04-30 15:22:42',1),(7,'P001','示例螺纹钢','HRB400-16mm','WH017','测试12','inbound','IN20260430014',2,2.000,0,0.000,2,2.000,NULL,'admin','2026-04-30 15:23:31',NULL,'2026-04-30 15:23:31',0),(8,'100','009','009','WH014','','inbound','IN20260430013',1,0.001,0,0.000,1,0.001,NULL,'admin','2026-04-30 15:40:42','admin','2026-04-30 15:40:57',1),(9,'P001','示例螺纹钢','HRB400-16mm','WH017','测试12','outbound','OUT20260501001',-1,-1.000,2,2.000,1,1.000,NULL,'admin','2026-04-30 16:44:39','admin','2026-04-30 16:45:32',1),(10,'P001','示例螺纹钢','HRB400-16mm','WH017','测试12','outbound','OUT20260501001',-1,-1.000,2,2.000,1,1.000,NULL,'admin','2026-04-30 16:46:12',NULL,'2026-04-30 16:46:12',0),(11,'101','100','100','WH017','测试12','inbound','IN20260501001',1,1.000,0,0.000,1,1.000,NULL,'admin','2026-05-01 04:32:40',NULL,'2026-05-01 04:32:40',0),(12,'101','100','100','WH017','测试12','inbound','IN20260501002',1,1.000,1,1.000,2,2.000,NULL,'admin','2026-05-01 05:01:06',NULL,'2026-05-01 05:01:06',0),(13,'102','100','100','WH014','','inbound','IN20260430012',1,0.001,0,0.000,1,0.001,NULL,'admin','2026-05-01 10:13:11',NULL,'2026-05-01 10:13:11',0);
/*!40000 ALTER TABLE `stock_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier`
--

DROP TABLE IF EXISTS `supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `supplier_code` varchar(50) NOT NULL COMMENT '缂栧彿锛堝敮涓?級',
  `supplier_name` varchar(100) NOT NULL COMMENT '鍚嶇О',
  `supplier_short` varchar(50) DEFAULT NULL COMMENT '绠?О',
  `contact_person` varchar(50) DEFAULT NULL COMMENT '鑱旂郴浜',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '鐢佃瘽',
  `contact_email` varchar(100) DEFAULT NULL COMMENT '閭??',
  `supplier_type` varchar(50) DEFAULT NULL COMMENT '绫诲瀷',
  `level` varchar(20) DEFAULT NULL COMMENT '绛夌骇',
  `is_enabled` tinyint DEFAULT '1' COMMENT '鍚?敤',
  `cooperation_status` varchar(20) DEFAULT NULL COMMENT '鍚堜綔鐘舵?',
  `remark` varchar(200) DEFAULT NULL COMMENT '澶囨敞',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_supplier_code` (`supplier_code`),
  UNIQUE KEY `uk_supplier_name` (`supplier_name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='渚涘簲鍟嗚〃';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier`
--

LOCK TABLES `supplier` WRITE;
/*!40000 ALTER TABLE `supplier` DISABLE KEYS */;
INSERT INTO `supplier` VALUES (1,'SUPP000001','示例钢铁供应商','示例钢供','李四','13900002222','lisi@example.com','生产商','A',1,'合作中','示例供应商，用于开发测试',NULL,'2026-04-30 17:29:30','admin','2026-04-30 16:14:48',0),(4,'SUPP000003','测试','测试','测试','测试','测s','是额','A',0,'合作中','','admin','2026-04-30 12:41:42','admin','2026-04-30 16:15:03',0);
/*!40000 ALTER TABLE `supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_config`
--

DROP TABLE IF EXISTS `sys_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_value` text COLLATE utf8mb4_unicode_ci,
  `config_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '系统参数',
  `sort_order` int DEFAULT '0',
  `remark` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`),
  UNIQUE KEY `config_key_2` (`config_key`),
  UNIQUE KEY `config_key_3` (`config_key`),
  UNIQUE KEY `config_key_4` (`config_key`),
  UNIQUE KEY `config_key_5` (`config_key`),
  UNIQUE KEY `config_key_6` (`config_key`),
  UNIQUE KEY `config_key_7` (`config_key`),
  UNIQUE KEY `config_key_8` (`config_key`),
  UNIQUE KEY `config_key_9` (`config_key`),
  UNIQUE KEY `config_key_10` (`config_key`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_config`
--

LOCK TABLES `sys_config` WRITE;
/*!40000 ALTER TABLE `sys_config` DISABLE KEYS */;
INSERT INTO `sys_config` VALUES (1,'alert_low_default','20','默认预警下限(吨)','库存预警',1,'新建商品入库时默认的库存预警下限','2026-05-01 10:40:10','2026-05-01 10:40:10',0),(2,'alert_high_default','200','默认预警上限(吨)','库存预警',2,'新建商品入库时默认的库存预警上限','2026-05-01 10:40:10','2026-05-01 10:40:10',0),(3,'default_password','123456','默认密码','用户管理',3,'新建用户时的初始密码','2026-05-01 10:40:10','2026-05-01 10:40:10',0),(4,'session_timeout','480','会话超时(分钟)','用户管理',4,'登录令牌过期时间','2026-05-01 10:40:10','2026-05-01 10:40:10',0),(5,'max_export_rows','10000','最大导出行数','系统参数',5,'Excel 导出数据行数上限','2026-05-01 10:40:10','2026-05-01 10:40:10',0),(6,'poll_interval','60','消息轮询间隔(秒)','系统参数',6,'前端轮询未读消息的时间间隔','2026-05-01 10:40:10','2026-05-01 10:40:10',0);
/*!40000 ALTER TABLE `sys_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_dict_data`
--

DROP TABLE IF EXISTS `sys_dict_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dict_data` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dict_type_code` varchar(50) NOT NULL COMMENT '关联字典类型编码',
  `dict_label` varchar(100) NOT NULL COMMENT '显示文本',
  `dict_value` varchar(100) NOT NULL COMMENT '取值',
  `sort_order` int DEFAULT '0',
  `is_enabled` tinyint DEFAULT '1',
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典数据表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_dict_data`
--

LOCK TABLES `sys_dict_data` WRITE;
/*!40000 ALTER TABLE `sys_dict_data` DISABLE KEYS */;
INSERT INTO `sys_dict_data` VALUES (1,'supplier_level','A级(优)','A',1,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(2,'supplier_level','B级(良)','B',2,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(3,'supplier_level','C级(中)','C',3,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(4,'customer_level','A级(优)','A',1,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(5,'customer_level','B级(良)','B',2,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(6,'customer_level','C级(中)','C',3,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(7,'supplier_type','厂家','厂家',1,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(8,'supplier_type','经销商','经销商',2,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(9,'supplier_type','代理商','代理商',3,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(10,'supplier_type','其他','其他',4,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(11,'cooperation_status','合作中','合作中',1,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(12,'cooperation_status','已暂停','已暂停',2,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(13,'cooperation_status','已终止','已终止',3,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(14,'product_status','正常','正常',1,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(15,'product_status','停用','停用',2,1,NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0);
/*!40000 ALTER TABLE `sys_dict_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_dict_type`
--

DROP TABLE IF EXISTS `sys_dict_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_dict_type` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dict_code` varchar(50) NOT NULL COMMENT '字典编码',
  `dict_name` varchar(100) NOT NULL COMMENT '字典名称',
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dict_code` (`dict_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典类型表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_dict_type`
--

LOCK TABLES `sys_dict_type` WRITE;
/*!40000 ALTER TABLE `sys_dict_type` DISABLE KEYS */;
INSERT INTO `sys_dict_type` VALUES (1,'supplier_level','供应商等级',NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(2,'customer_level','客户等级',NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(3,'supplier_type','供应商类型',NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(4,'cooperation_status','合作状态',NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0),(5,'product_status','商品状态',NULL,'admin','2026-05-01 12:14:40',NULL,'2026-05-01 12:14:40',0);
/*!40000 ALTER TABLE `sys_dict_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_message`
--

DROP TABLE IF EXISTS `sys_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `business_type` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_id` int DEFAULT NULL,
  `is_read` tinyint DEFAULT '0',
  `create_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_message`
--

LOCK TABLES `sys_message` WRITE;
/*!40000 ALTER TABLE `sys_message` DISABLE KEYS */;
INSERT INTO `sys_message` VALUES (1,'库存低于预警下限','商品「003 短纤」在仓库「测试2」当前库存吨位 0.001，低于预警下限 50.000 吨。请及时处理。','alert_low','stock','WH005_003_alert_low',NULL,1,'2026-05-01 10:11:01',0),(2,'库存低于预警下限','商品「102 102」在仓库「测试12」当前库存吨位 0.002，低于预警下限 50.000 吨。请及时处理。','alert_low','stock','WH017_102_alert_low',NULL,1,'2026-05-01 10:11:01',0),(3,'库存低于预警下限','商品「P001 示例螺纹钢」在仓库「测试12」当前库存吨位 1.000，低于预警下限 50.000 吨。请及时处理。','alert_low','stock','WH017_P001_alert_low',NULL,1,'2026-05-01 10:11:01',0),(4,'库存低于预警下限','商品「100 009」在仓库「WH014」当前库存吨位 0.000，低于预警下限 20.000 吨。请及时处理。','alert_low','stock','WH014_100_alert_low',NULL,1,'2026-05-01 10:11:01',0),(5,'待审核入库单','入库单「IN20260501003」已提交审核，请及时处理。','order_submit','inbound','IN20260501003',1,1,'2026-05-01 10:13:29',0),(6,'待审核入库单','入库单「IN20260501003」已提交审核，请及时处理。','order_submit','inbound','IN20260501003',3,0,'2026-05-01 10:13:29',0);
/*!40000 ALTER TABLE `sys_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_operation_log`
--

DROP TABLE IF EXISTS `sys_operation_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_operation_log` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `module` varchar(50) DEFAULT NULL COMMENT '模块',
  `operation` varchar(100) DEFAULT NULL COMMENT '操作描述',
  `operation_desc` varchar(500) DEFAULT NULL COMMENT '操作描述',
  `business_type` varchar(50) DEFAULT NULL COMMENT '业务类型',
  `business_id` varchar(50) DEFAULT NULL COMMENT '业务ID',
  `request_url` varchar(200) DEFAULT NULL COMMENT '请求路径',
  `method` varchar(10) DEFAULT NULL COMMENT 'GET/POST/PUT/DELETE',
  `params` text COMMENT '请求参数JSON',
  `ip` varchar(50) DEFAULT NULL COMMENT '客户端IP',
  `cost_time` int DEFAULT NULL COMMENT '耗时毫秒',
  `status` tinyint DEFAULT '1' COMMENT '1成功 0失败',
  `error_msg` varchar(500) DEFAULT NULL,
  `create_time` datetime DEFAULT ((now() + interval 8 hour)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=555 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='操作日志表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_operation_log`
--

LOCK TABLES `sys_operation_log` WRITE;
/*!40000 ALTER TABLE `sys_operation_log` DISABLE KEYS */;
INSERT INTO `sys_operation_log` VALUES (1,NULL,'anonymous','其他','GET /data/customer_level',NULL,NULL,NULL,'/api/sys/dict/data/customer_level','GET','{}','::1',4,0,'HTTP 401','2026-05-01 04:26:30'),(2,NULL,'anonymous','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',1,0,'HTTP 401','2026-05-01 04:26:39'),(3,NULL,'anonymous','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list','GET','{}','::1',1,0,'HTTP 401','2026-05-01 04:26:39'),(4,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',85,1,NULL,'2026-05-01 04:26:53'),(5,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list','GET','{}','::1',9,1,NULL,'2026-05-01 04:26:53'),(6,1,'admin','其他','GET /data/customer_level',NULL,NULL,NULL,'/api/sys/dict/data/customer_level','GET','{}','::1',3,1,NULL,'2026-05-01 04:26:53'),(7,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',3,1,NULL,'2026-05-01 04:26:53'),(8,NULL,'anonymous','其他','GET /data/supplier_type',NULL,NULL,NULL,'/api/sys/dict/data/supplier_type','GET','{}','::1',1,0,'HTTP 401','2026-05-01 04:27:10'),(9,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',68,1,NULL,'2026-05-01 04:27:18'),(10,1,'admin','其他','GET /data/supplier_type',NULL,NULL,NULL,'/api/sys/dict/data/supplier_type','GET','{}','::1',3,1,NULL,'2026-05-01 04:27:18'),(11,1,'admin','其他','GET /data/cooperation_status',NULL,NULL,NULL,'/api/sys/dict/data/cooperation_status','GET','{}','::1',2,1,NULL,'2026-05-01 04:27:18'),(12,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',11,1,NULL,'2026-05-01 04:30:06'),(13,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',21,1,NULL,'2026-05-01 04:30:06'),(14,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:30:09'),(15,1,'admin','其他','GET /type/list',NULL,NULL,NULL,'/api/sys/dict/type/list','GET','{}','::1',5,1,NULL,'2026-05-01 04:30:20'),(16,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=cooperation_status','GET','{\"dict_type_code\":\"cooperation_status\"}','::1',3,1,NULL,'2026-05-01 04:30:27'),(17,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=cooperation_status','GET','{\"dict_type_code\":\"cooperation_status\"}','::1',2,1,NULL,'2026-05-01 04:30:28'),(18,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=supplier_level','GET','{\"dict_type_code\":\"supplier_level\"}','::1',3,1,NULL,'2026-05-01 04:30:31'),(19,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=customer_level','GET','{\"dict_type_code\":\"customer_level\"}','::1',3,1,NULL,'2026-05-01 04:30:31'),(20,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=supplier_type','GET','{\"dict_type_code\":\"supplier_type\"}','::1',2,1,NULL,'2026-05-01 04:30:32'),(21,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=cooperation_status','GET','{\"dict_type_code\":\"cooperation_status\"}','::1',3,1,NULL,'2026-05-01 04:30:33'),(22,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=product_status','GET','{\"dict_type_code\":\"product_status\"}','::1',2,1,NULL,'2026-05-01 04:30:34'),(23,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=cooperation_status','GET','{\"dict_type_code\":\"cooperation_status\"}','::1',2,1,NULL,'2026-05-01 04:30:36'),(24,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=supplier_type','GET','{\"dict_type_code\":\"supplier_type\"}','::1',2,1,NULL,'2026-05-01 04:30:36'),(25,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=customer_level','GET','{\"dict_type_code\":\"customer_level\"}','::1',1,1,NULL,'2026-05-01 04:30:36'),(26,1,'admin','其他','GET /data/list',NULL,NULL,NULL,'/api/sys/dict/data/list?dict_type_code=supplier_level','GET','{\"dict_type_code\":\"supplier_level\"}','::1',3,1,NULL,'2026-05-01 04:30:37'),(27,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',2,1,NULL,'2026-05-01 04:30:38'),(28,1,'admin','其他','GET /type/list',NULL,NULL,NULL,'/api/sys/dict/type/list','GET','{}','::1',2,1,NULL,'2026-05-01 04:30:46'),(29,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:30:46'),(30,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 04:30:47'),(31,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?pageSize=1000','GET','{\"pageSize\":\"1000\"}','::1',7,1,NULL,'2026-05-01 04:30:47'),(32,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 04:31:45'),(33,1,'admin','其他','GET /export',NULL,NULL,NULL,'/api/sys/log/export','GET','{}','::1',29,1,NULL,'2026-05-01 04:31:49'),(34,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',10,1,NULL,'2026-05-01 04:32:09'),(35,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',16,1,NULL,'2026-05-01 04:32:09'),(36,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 04:32:11'),(37,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=20&enabled=1','GET','{\"page\":\"1\",\"pageSize\":\"20\",\"enabled\":\"1\"}','::1',5,1,NULL,'2026-05-01 04:32:11'),(38,1,'admin','其他','GET /search',NULL,NULL,NULL,'/api/vehicle/search','GET','{}','::1',3,1,NULL,'2026-05-01 04:32:11'),(39,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=20&enabled=1','GET','{\"page\":\"1\",\"pageSize\":\"20\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 04:32:14'),(40,1,'admin','其他','GET /search',NULL,NULL,NULL,'/api/vehicle/search','GET','{}','::1',1,1,NULL,'2026-05-01 04:32:15'),(41,1,'admin','其他','GET /search',NULL,NULL,NULL,'/api/product/search','GET','{}','::1',3,1,NULL,'2026-05-01 04:32:17'),(42,1,'admin','其他','POST /',NULL,NULL,NULL,'/api/inbound/order','POST','{\"bill_type_code\":\"采购入库\",\"warehouse_code\":\"WH017\",\"supplier_code\":\"SUPP000001\",\"inbound_date\":\"2026-05-01\",\"vehicle_no\":\"浙B123456\",\"container_no\":\"\",\"delivery_no\":\"\",\"remark\":\"\",\"order_no\":\"\",\"lock_version\":0,\"order_status\":\"submit\",\"details\":[{\"uuid\":\"d_1_1777609930945\",\"product_code\":\"101\",\"product_name\":\"100\",\"product_model\":\"100\",\"inbound_qty\":1,\"inbound_weight\":1,\"detail_remark\":\"\"}]}','::1',22,1,NULL,'2026-05-01 04:32:22'),(43,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',5,1,NULL,'2026-05-01 04:32:22'),(44,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',10,1,NULL,'2026-05-01 04:32:22'),(45,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 04:32:24'),(46,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 04:32:35'),(47,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',11,1,NULL,'2026-05-01 04:32:35'),(48,1,'admin','其他','POST /batch-audit',NULL,NULL,NULL,'/api/inbound/order/batch-audit','POST','{\"items\":[{\"id\":16,\"lock_version\":0}]}','::1',20,1,NULL,'2026-05-01 04:32:40'),(49,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 04:32:40'),(50,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 04:32:42'),(51,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=2&pageSize=10','GET','{\"page\":\"2\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 04:32:53'),(52,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=3&pageSize=10','GET','{\"page\":\"3\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:32:55'),(53,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=4&pageSize=10','GET','{\"page\":\"4\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:32:56'),(54,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=5&pageSize=10','GET','{\"page\":\"5\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:32:56'),(55,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=6&pageSize=10','GET','{\"page\":\"6\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:32:57'),(56,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:33:02'),(57,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 04:33:28'),(58,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:33:29'),(59,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:33:38'),(60,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 04:33:52'),(61,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',11,1,NULL,'2026-05-01 04:33:52'),(62,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:34:00'),(63,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=2&pageSize=10','GET','{\"page\":\"2\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 04:35:05'),(64,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=3&pageSize=10','GET','{\"page\":\"3\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 04:35:07'),(65,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=4&pageSize=10','GET','{\"page\":\"4\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:35:09'),(66,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=5&pageSize=10','GET','{\"page\":\"5\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:35:10'),(67,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=4&pageSize=10','GET','{\"page\":\"4\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:35:11'),(68,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 04:35:12'),(69,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',9,1,NULL,'2026-05-01 12:53:25'),(70,1,'admin','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 12:54:32'),(71,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',95,1,NULL,'2026-05-01 12:54:32'),(72,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?pageSize=3','GET','{\"pageSize\":\"3\"}','::1',7,1,NULL,'2026-05-01 12:54:33'),(74,1,'admin','其他','POST /',NULL,NULL,NULL,'/api/product','POST','{\"product_code\":\"TEST-LOG-001\",\"product_name\":\"��־������Ʒ\",\"product_model\":\"TEST\",\"category_code\":\"raw\",\"unit\":\"kg\",\"status\":\"����\"}','::1',7,1,NULL,'2026-05-01 12:54:33'),(75,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?pageSize=3','GET','{\"pageSize\":\"3\"}','::1',4,1,NULL,'2026-05-01 12:54:33'),(76,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?pageSize=1','GET','{\"pageSize\":\"1\"}','::1',3,1,NULL,'2026-05-01 12:54:33'),(77,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 12:54:36'),(78,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 12:56:15'),(79,1,'admin','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 12:56:41'),(80,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',77,1,NULL,'2026-05-01 12:56:41'),(81,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 12:56:41'),(82,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?pageSize=5','GET','{\"pageSize\":\"5\"}','::1',5,1,NULL,'2026-05-01 12:56:41'),(83,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 12:56:45'),(84,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 12:56:46'),(85,1,'admin','其他','GET /type/list',NULL,NULL,NULL,'/api/sys/dict/type/list','GET','{}','::1',4,1,NULL,'2026-05-01 12:56:49'),(86,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 12:56:50'),(87,1,'admin','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 12:56:54'),(88,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',70,1,NULL,'2026-05-01 12:56:54'),(89,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?pageSize=3&businessType=product','GET','{\"pageSize\":\"3\",\"businessType\":\"product\"}','::1',3,1,NULL,'2026-05-01 12:56:54'),(90,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100','GET','{\"page\":\"1\",\"pageSize\":\"100\"}','::1',5,1,NULL,'2026-05-01 12:56:57'),(91,1,'admin','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 12:57:05'),(92,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',69,1,NULL,'2026-05-01 12:57:05'),(93,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/list?keyword=TEST-LOG-001','GET','{\"keyword\":\"TEST-LOG-001\"}','::1',4,1,NULL,'2026-05-01 12:57:05'),(95,1,'admin','其他','DELETE /23',NULL,NULL,NULL,'/api/product/23','DELETE','{}','::1',7,1,NULL,'2026-05-01 12:57:05'),(96,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100&module=%E5%85%A5%E5%BA%93%E7%AE%A1%E7%90%86','GET','{\"page\":\"1\",\"pageSize\":\"100\",\"module\":\"入库管理\"}','::1',2,1,NULL,'2026-05-01 12:57:11'),(97,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100','GET','{\"page\":\"1\",\"pageSize\":\"100\"}','::1',4,1,NULL,'2026-05-01 12:57:13'),(98,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100&module=%E5%87%BA%E5%BA%93%E7%AE%A1%E7%90%86','GET','{\"page\":\"1\",\"pageSize\":\"100\",\"module\":\"出库管理\"}','::1',2,1,NULL,'2026-05-01 12:57:15'),(99,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100&module=%E5%BA%93%E5%AD%98%E7%AE%A1%E7%90%86','GET','{\"page\":\"1\",\"pageSize\":\"100\",\"module\":\"库存管理\"}','::1',1,1,NULL,'2026-05-01 12:57:18'),(100,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100&module=%E7%99%BB%E5%BD%95','GET','{\"page\":\"1\",\"pageSize\":\"100\",\"module\":\"登录\"}','::1',2,1,NULL,'2026-05-01 12:57:19'),(101,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100&module=%E7%B3%BB%E7%BB%9F%E7%AE%A1%E7%90%86','GET','{\"page\":\"1\",\"pageSize\":\"100\",\"module\":\"系统管理\"}','::1',1,1,NULL,'2026-05-01 12:57:22'),(102,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100&module=%E5%9F%BA%E7%A1%80%E8%B5%84%E6%96%99','GET','{\"page\":\"1\",\"pageSize\":\"100\",\"module\":\"基础资料\"}','::1',2,1,NULL,'2026-05-01 12:57:25'),(103,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100','GET','{\"page\":\"1\",\"pageSize\":\"100\"}','::1',4,1,NULL,'2026-05-01 12:57:27'),(104,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',9,1,NULL,'2026-05-01 13:00:00'),(105,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 13:00:02'),(106,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 13:00:03'),(107,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=20','GET','{\"page\":\"1\",\"pageSize\":\"20\"}','::1',4,1,NULL,'2026-05-01 13:00:07'),(108,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',8,1,NULL,'2026-05-01 13:00:30'),(109,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',15,1,NULL,'2026-05-01 13:00:30'),(110,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 13:00:31'),(111,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=20&enabled=1','GET','{\"page\":\"1\",\"pageSize\":\"20\",\"enabled\":\"1\"}','::1',3,1,NULL,'2026-05-01 13:00:31'),(112,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/vehicle/search','GET','{}','::1',2,1,NULL,'2026-05-01 13:00:31'),(113,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=20&enabled=1','GET','{\"page\":\"1\",\"pageSize\":\"20\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 13:00:34'),(114,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/vehicle/search','GET','{}','::1',2,1,NULL,'2026-05-01 13:00:35'),(115,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',2,1,NULL,'2026-05-01 13:00:37'),(116,1,'admin','入库管理','提交入库单','提交入库单，单号 IN20260501002','inbound','17',NULL,'POST','{\"bill_type_code\":\"采购入库\",\"warehouse_code\":\"WH017\",\"supplier_code\":\"SUPP000001\",\"inbound_date\":\"2026-05-01\",\"vehicle_no\":\"浙B123456\",\"container_no\":\"\",\"delivery_no\":\"\",\"remark\":\"\",\"order_no\":\"\",\"lock_version\":0,\"order_status\":\"submit\",\"details\":[{\"uuid\":\"d_1_1777611631846\",\"product_code\":\"101\",\"product_name\":\"100\",\"product_model\":\"100\",\"inbound_qty\":1,\"inbound_weight\":1,\"detail_remark\":\"\"}]}','::1',NULL,1,NULL,'2026-05-01 13:00:40'),(117,1,'admin','其他','POST /',NULL,NULL,NULL,'/api/inbound/order','POST','{\"bill_type_code\":\"采购入库\",\"warehouse_code\":\"WH017\",\"supplier_code\":\"SUPP000001\",\"inbound_date\":\"2026-05-01\",\"vehicle_no\":\"浙B123456\",\"container_no\":\"\",\"delivery_no\":\"\",\"remark\":\"\",\"order_no\":\"\",\"lock_version\":0,\"order_status\":\"submit\",\"details\":[{\"uuid\":\"d_1_1777611631846\",\"product_code\":\"101\",\"product_name\":\"100\",\"product_model\":\"100\",\"inbound_qty\":1,\"inbound_weight\":1,\"detail_remark\":\"\"}]}','::1',18,1,NULL,'2026-05-01 13:00:40'),(118,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',6,1,NULL,'2026-05-01 13:00:41'),(119,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',12,1,NULL,'2026-05-01 13:00:41'),(120,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 13:00:42'),(121,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 13:01:02'),(122,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',10,1,NULL,'2026-05-01 13:01:02'),(123,1,'admin','入库管理','批量审核入库单','批量审核入库单，成功 1 条，失败 0 条','inbound',NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 13:01:06'),(124,1,'admin','其他','POST /batch-audit',NULL,NULL,NULL,'/api/inbound/order/batch-audit','POST','{\"items\":[{\"id\":17,\"lock_version\":0}]}','::1',15,1,NULL,'2026-05-01 13:01:06'),(125,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 13:01:06'),(126,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',1,1,NULL,'2026-05-01 13:01:08'),(127,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 13:01:09'),(128,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=2&pageSize=10','GET','{\"page\":\"2\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 13:01:15'),(129,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=3&pageSize=10','GET','{\"page\":\"3\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 13:01:19'),(130,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=4&pageSize=10','GET','{\"page\":\"4\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 13:01:19'),(131,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=5&pageSize=10','GET','{\"page\":\"5\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 13:01:23'),(132,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',6,1,NULL,'2026-05-01 13:01:25'),(133,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',26,1,NULL,'2026-05-01 13:01:25'),(134,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=2&pageSize=10','GET','{\"page\":\"2\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 13:01:27'),(135,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 13:02:44'),(136,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100','GET','{\"page\":\"1\",\"pageSize\":\"100\"}','::1',5,1,NULL,'2026-05-01 13:02:46'),(137,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',10,1,NULL,'2026-05-01 13:05:31'),(138,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',15,1,NULL,'2026-05-01 13:06:14'),(139,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 13:06:19'),(140,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',9,1,NULL,'2026-05-01 13:06:34'),(141,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',15,1,NULL,'2026-05-01 13:06:38'),(142,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',25,1,NULL,'2026-05-01 13:06:38'),(143,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 13:07:37'),(144,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=100','GET','{\"page\":\"1\",\"pageSize\":\"100\"}','::1',6,1,NULL,'2026-05-01 13:07:38'),(145,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 13:07:47'),(146,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=1000','GET','{\"page\":\"1\",\"pageSize\":\"1000\"}','::1',8,1,NULL,'2026-05-01 13:07:54'),(147,1,'admin','其他','GET /type/list',NULL,NULL,NULL,'/api/sys/dict/type/list','GET','{}','::1',6,1,NULL,'2026-05-01 13:09:33'),(148,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 13:09:34'),(149,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 13:09:34'),(150,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=1000','GET','{\"page\":\"1\",\"pageSize\":\"1000\"}','::1',6,1,NULL,'2026-05-01 13:09:36'),(151,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',18,1,NULL,'2026-05-01 13:16:21'),(152,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?pageSize=1000','GET','{\"pageSize\":\"1000\"}','::1',15,1,NULL,'2026-05-01 13:16:25'),(153,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',18,1,NULL,'2026-05-01 13:16:25'),(154,1,'admin','系统管理','创建用户','创建用户「113」','user','4',NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 13:17:22'),(155,1,'admin','其他','POST /',NULL,NULL,NULL,'/api/sys/user','POST','{\"username\":\"113\",\"nickname\":\"测试\",\"phone\":\"\",\"email\":\"\",\"status\":1,\"role_ids\":[2],\"remark\":\"\"}','::1',83,1,NULL,'2026-05-01 13:17:22'),(156,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 13:17:22'),(157,NULL,'113','登录','POST /api/login','登录失败（密码错误）',NULL,NULL,NULL,'POST',NULL,'::1',NULL,0,'用户名或密码错误','2026-05-01 13:17:56'),(158,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"113\",\"password\":\"***\"}','::1',74,0,'HTTP 401','2026-05-01 13:17:56'),(159,4,'113','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 13:18:19'),(160,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"113\",\"password\":\"***\"}','::1',70,1,NULL,'2026-05-01 13:18:19'),(161,4,'113','其他','GET /profile',NULL,NULL,NULL,'/api/user/profile','GET','{}','::1',3,1,NULL,'2026-05-01 13:18:27'),(162,4,'113','其他','GET /tree',NULL,NULL,NULL,'/api/product/category/tree','GET','{}','::1',6,1,NULL,'2026-05-01 13:18:38'),(163,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/product/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 13:18:47'),(164,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/product/category/list','GET','{}','::1',12,1,NULL,'2026-05-01 13:18:47'),(165,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 13:18:49'),(166,4,'113','其他','GET /data/supplier_type',NULL,NULL,NULL,'/api/sys/dict/data/supplier_type','GET','{}','::1',7,1,NULL,'2026-05-01 13:18:53'),(167,4,'113','其他','GET /data/cooperation_status',NULL,NULL,NULL,'/api/sys/dict/data/cooperation_status','GET','{}','::1',11,1,NULL,'2026-05-01 13:18:53'),(168,4,'113','其他','GET /data/supplier_level',NULL,NULL,NULL,'/api/sys/dict/data/supplier_level','GET','{}','::1',7,1,NULL,'2026-05-01 13:18:53'),(169,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',14,1,NULL,'2026-05-01 13:18:53'),(170,4,'113','其他','GET /data/customer_level',NULL,NULL,NULL,'/api/sys/dict/data/customer_level','GET','{}','::1',3,1,NULL,'2026-05-01 13:18:56'),(171,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/customer/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 13:18:56'),(172,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/vehicle/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 13:18:57'),(173,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',4,1,NULL,'2026-05-01 13:19:01'),(174,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',10,1,NULL,'2026-05-01 13:19:01'),(175,4,'113','其他','GET /profile',NULL,NULL,NULL,'/api/user/profile','GET','{}','::1',5,1,NULL,'2026-05-01 13:19:16'),(176,1,'admin','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 13:21:42'),(177,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',71,1,NULL,'2026-05-01 13:21:42'),(178,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 13:21:46'),(179,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?pageSize=1000','GET','{\"pageSize\":\"1000\"}','::1',8,1,NULL,'2026-05-01 13:21:46'),(180,4,'113','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 13:21:59'),(181,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"113\",\"password\":\"***\"}','::1',72,1,NULL,'2026-05-01 13:21:59'),(182,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',6,1,NULL,'2026-05-01 13:22:03'),(183,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',13,1,NULL,'2026-05-01 13:22:03'),(184,4,'113','其他','POST /batch-audit',NULL,NULL,NULL,'/api/inbound/order/batch-audit','POST','{\"items\":[{\"id\":13,\"lock_version\":0}]}','::1',NULL,0,'HTTP 403','2026-05-01 13:22:13'),(185,4,'113','其他','GET /tree',NULL,NULL,NULL,'/api/product/category/tree','GET','{}','::1',4,1,NULL,'2026-05-01 13:22:20'),(186,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',13,1,NULL,'2026-05-01 14:52:49'),(187,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',32,1,NULL,'2026-05-01 14:52:49'),(188,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 14:52:50'),(189,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',3,1,NULL,'2026-05-01 14:52:50'),(190,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',13,1,NULL,'2026-05-01 15:37:17'),(191,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',22,1,NULL,'2026-05-01 15:37:17'),(192,NULL,'anonymous','其他','GET /api/print/template/list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',2,0,'HTTP 404','2026-05-01 15:39:06'),(193,NULL,'anonymous','其他','GET /api/print/template/list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',1,0,'HTTP 404','2026-05-01 15:39:28'),(194,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',11,1,NULL,'2026-05-01 15:39:43'),(195,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',33,0,'HTTP 405','2026-05-01 15:39:59'),(196,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',10,0,'HTTP 405','2026-05-01 15:40:20'),(197,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',10,1,NULL,'2026-05-01 15:44:39'),(198,4,'113','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',15,1,NULL,'2026-05-01 15:44:39'),(199,1,'admin','登录','POST /api/login','用户登录成功',NULL,NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 15:45:09'),(200,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',81,1,NULL,'2026-05-01 15:45:09'),(201,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',3,1,NULL,'2026-05-01 15:45:12'),(202,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',6,1,NULL,'2026-05-01 15:45:19'),(203,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',12,1,NULL,'2026-05-01 15:45:19'),(204,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',3,1,NULL,'2026-05-01 15:45:21'),(205,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/customer/search','GET','{}','::1',3,1,NULL,'2026-05-01 15:45:21'),(206,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/vehicle/search','GET','{}','::1',3,1,NULL,'2026-05-01 15:45:21'),(207,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',4,1,NULL,'2026-05-01 15:45:21'),(208,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/customer/search','GET','{}','::1',2,1,NULL,'2026-05-01 15:45:21'),(209,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 15:45:25'),(210,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 15:45:25'),(211,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',3,1,NULL,'2026-05-01 15:45:29'),(212,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',6,1,NULL,'2026-05-01 15:46:12'),(213,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',8,1,NULL,'2026-05-01 15:46:24'),(214,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',11,1,NULL,'2026-05-01 15:46:24'),(215,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',4,1,NULL,'2026-05-01 15:46:27'),(216,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',8,0,'HTTP 405','2026-05-01 15:46:28'),(217,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',5,0,'HTTP 405','2026-05-01 15:46:39'),(218,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',6,0,'HTTP 405','2026-05-01 15:46:47'),(219,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',7,0,'HTTP 405','2026-05-01 15:46:53'),(220,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 15:48:38'),(221,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',10,1,NULL,'2026-05-01 15:52:11'),(222,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',17,1,NULL,'2026-05-01 15:52:11'),(223,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',4,1,NULL,'2026-05-01 15:52:12'),(224,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',8,0,'HTTP 405','2026-05-01 15:52:14'),(225,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',1,1,NULL,'2026-05-01 15:52:17'),(226,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',4,1,NULL,'2026-05-01 15:52:18'),(227,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',2,1,NULL,'2026-05-01 15:52:19'),(228,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',4,1,NULL,'2026-05-01 15:53:52'),(229,NULL,'anonymous','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',1,0,'HTTP 401','2026-05-01 15:54:10'),(230,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',13,0,'HTTP 400','2026-05-01 15:54:21'),(231,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',8,0,'HTTP 400','2026-05-01 15:54:28'),(232,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',10,0,'HTTP 400','2026-05-01 15:55:10'),(233,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',10,0,'HTTP 400','2026-05-01 15:56:07'),(234,1,'admin','其他','POST /outbound/OB20260430001',NULL,NULL,NULL,'/api/print/outbound/OB20260430001','POST','{}','::1',110,1,NULL,'2026-05-01 15:56:34'),(235,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',7,1,NULL,'2026-05-01 15:57:09'),(236,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',2,1,NULL,'2026-05-01 15:57:10'),(237,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',13,1,NULL,'2026-05-01 15:57:12'),(238,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',18,1,NULL,'2026-05-01 15:57:12'),(239,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',7,1,NULL,'2026-05-01 15:57:14'),(240,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',88,1,NULL,'2026-05-01 15:57:15'),(241,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',9,1,NULL,'2026-05-01 15:58:30'),(242,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',14,1,NULL,'2026-05-01 15:58:30'),(243,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',2,1,NULL,'2026-05-01 15:58:40'),(244,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 16:00:39'),(245,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',5,1,NULL,'2026-05-01 16:00:51'),(246,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 16:00:57'),(247,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',10,1,NULL,'2026-05-01 16:00:57'),(248,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',3,1,NULL,'2026-05-01 16:00:59'),(249,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',82,1,NULL,'2026-05-01 16:01:01'),(250,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',72,1,NULL,'2026-05-01 16:01:17'),(251,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',3,1,NULL,'2026-05-01 16:01:20'),(252,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',8,1,NULL,'2026-05-01 16:01:22'),(253,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',12,1,NULL,'2026-05-01 16:01:22'),(254,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',4,1,NULL,'2026-05-01 16:01:24'),(255,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',73,1,NULL,'2026-05-01 16:01:25'),(256,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',59,1,NULL,'2026-05-01 16:01:39'),(257,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',55,1,NULL,'2026-05-01 16:01:45'),(258,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 16:01:58'),(259,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',12,1,NULL,'2026-05-01 16:01:58'),(260,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',58,1,NULL,'2026-05-01 16:02:01'),(261,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',5,1,NULL,'2026-05-01 16:03:02'),(262,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',8,1,NULL,'2026-05-01 16:03:02'),(263,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',5,1,NULL,'2026-05-01 16:03:30'),(264,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',8,1,NULL,'2026-05-01 16:03:30'),(265,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',55,1,NULL,'2026-05-01 16:03:33'),(266,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',3,1,NULL,'2026-05-01 16:03:37'),(267,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',53,1,NULL,'2026-05-01 16:03:38'),(268,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',4,1,NULL,'2026-05-01 16:05:15'),(269,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',4,1,NULL,'2026-05-01 16:09:03'),(270,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',1,1,NULL,'2026-05-01 16:09:06'),(271,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',4,1,NULL,'2026-05-01 16:11:28'),(272,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',4,1,NULL,'2026-05-01 16:20:07'),(273,NULL,'anonymous','其他','GET /api/dashboard',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',2,0,'HTTP 404','2026-05-01 16:20:29'),(274,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',19,0,'HTTP 500','2026-05-01 16:20:51'),(275,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',18,1,NULL,'2026-05-01 16:21:46'),(276,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',5,1,NULL,'2026-05-01 16:21:56'),(277,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',2,1,NULL,'2026-05-01 16:21:58'),(278,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',8,1,NULL,'2026-05-01 16:21:59'),(279,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=30','GET','{\"days\":\"30\"}','::1',10,1,NULL,'2026-05-01 16:22:18'),(280,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',4,1,NULL,'2026-05-01 16:22:19'),(281,1,'admin','其他','GET /tree',NULL,NULL,NULL,'/api/product/category/tree','GET','{}','::1',5,1,NULL,'2026-05-01 16:22:47'),(282,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/category/list','GET','{}','::1',9,1,NULL,'2026-05-01 16:22:49'),(283,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',9,1,NULL,'2026-05-01 16:22:49'),(284,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',20,1,NULL,'2026-05-01 16:23:04'),(285,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',20,1,NULL,'2026-05-01 16:23:04'),(286,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',21,1,NULL,'2026-05-01 16:23:04'),(287,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',7,1,NULL,'2026-05-01 16:23:55'),(288,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',7,1,NULL,'2026-05-01 16:23:57'),(289,NULL,'anonymous','系统管理','GET /api/sys/log/recent',NULL,NULL,NULL,'/api/sys/log/recent','GET','{}','::1',2,0,'HTTP 404','2026-05-01 16:29:25'),(290,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',13,1,NULL,'2026-05-01 16:29:25'),(291,1,'admin','其他','GET /recent',NULL,NULL,NULL,'/api/sys/log/recent','GET','{}','::1',14,1,NULL,'2026-05-01 16:29:59'),(292,1,'admin','其他','GET /recent',NULL,NULL,NULL,'/api/sys/log/recent','GET','{}','::1',8,1,NULL,'2026-05-01 16:30:32'),(293,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',20,1,NULL,'2026-05-01 16:30:32'),(294,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 16:33:34'),(295,NULL,'anonymous','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',4,0,'HTTP 401','2026-05-01 16:35:32'),(296,NULL,'anonymous','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',1,0,'HTTP 401','2026-05-01 16:38:41'),(297,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',13,1,NULL,'2026-05-01 16:39:26'),(298,NULL,'anonymous','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',6,0,'HTTP 401','2026-05-01 17:29:32'),(299,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',15,1,NULL,'2026-05-01 17:43:31'),(300,1,'admin','其他','GET /export','导出数据',NULL,NULL,'/api/sys/log/export','GET','{}','::1',66,1,NULL,'2026-05-01 17:43:55'),(301,1,'admin','其他','GET /tree',NULL,NULL,NULL,'/api/product/category/tree','GET','{}','::1',9,1,NULL,'2026-05-01 17:44:10'),(302,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 17:44:12'),(303,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/category/list','GET','{}','::1',7,1,NULL,'2026-05-01 17:44:12'),(304,1,'admin','其他','GET /export','导出数据',NULL,NULL,'/api/product/export','GET','{}','::1',10,1,NULL,'2026-05-01 17:44:14'),(305,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',9,1,NULL,'2026-05-01 17:44:23'),(306,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',15,1,NULL,'2026-05-01 17:44:23'),(307,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10&order_no=IN20260501002','GET','{\"page\":\"1\",\"pageSize\":\"10\",\"order_no\":\"IN20260501002\"}','::1',5,1,NULL,'2026-05-01 17:44:33'),(308,1,'admin','其他','GET /export','导出数据',NULL,NULL,'/api/inbound/order/export?order_no=IN20260501002','GET','{\"order_no\":\"IN20260501002\"}','::1',8,1,NULL,'2026-05-01 17:44:34'),(309,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 17:44:44'),(310,1,'admin','其他','GET /17',NULL,NULL,NULL,'/api/inbound/order/17','GET','{}','::1',8,1,NULL,'2026-05-01 17:44:48'),(311,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',8,1,NULL,'2026-05-01 17:45:10'),(312,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',11,1,NULL,'2026-05-01 17:45:10'),(313,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',9,1,NULL,'2026-05-01 17:45:22'),(314,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',10,1,NULL,'2026-05-01 17:45:22'),(315,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',10,1,NULL,'2026-05-01 17:45:22'),(316,1,'admin','其他','GET /export','导出数据',NULL,NULL,'/api/stock/export','GET','{}','::1',7,1,NULL,'2026-05-01 17:45:24'),(317,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',11,1,NULL,'2026-05-01 17:45:39'),(318,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 17:45:39'),(319,1,'admin','其他','GET /4',NULL,NULL,NULL,'/api/outbound/order/4','GET','{}','::1',5,1,NULL,'2026-05-01 17:45:41'),(320,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 17:46:08'),(321,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/category/list','GET','{}','::1',5,1,NULL,'2026-05-01 17:46:08'),(322,1,'admin','其他','GET /template',NULL,NULL,NULL,'/api/product/template','GET','{}','::1',6,1,NULL,'2026-05-01 17:46:15'),(323,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',9,1,NULL,'2026-05-01 17:47:09'),(324,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',14,1,NULL,'2026-05-01 17:47:09'),(325,1,'admin','其他','GET /17',NULL,NULL,NULL,'/api/inbound/order/17','GET','{}','::1',5,1,NULL,'2026-05-01 17:47:11'),(326,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 17:47:13'),(327,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 17:47:13'),(328,1,'admin','其他','GET /13',NULL,NULL,NULL,'/api/inbound/order/13','GET','{}','::1',5,1,NULL,'2026-05-01 17:47:15'),(329,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',3,1,NULL,'2026-05-01 17:47:16'),(330,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 17:47:16'),(331,1,'admin','其他','POST /inbound/IN20260501002',NULL,NULL,NULL,'/api/print/inbound/IN20260501002','POST','{}','::1',21,1,NULL,'2026-05-01 17:47:22'),(332,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',8,1,NULL,'2026-05-01 17:47:26'),(333,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',13,1,NULL,'2026-05-01 17:47:26'),(334,1,'admin','其他','POST /outbound/OUT20260501003',NULL,NULL,NULL,'/api/print/outbound/OUT20260501003','POST','{}','::1',68,1,NULL,'2026-05-01 17:47:28'),(335,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',8,1,NULL,'2026-05-01 18:07:44'),(336,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',13,1,NULL,'2026-05-01 18:07:44'),(337,NULL,'anonymous','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',5,0,'HTTP 401','2026-05-01 18:11:14'),(338,NULL,'admin','登录','POST /api/login','登录失败（密码错误）',NULL,NULL,NULL,'POST',NULL,'::1',NULL,0,'用户名或密码错误','2026-05-01 18:11:22'),(339,NULL,'anonymous','其他','POST /login',NULL,NULL,NULL,'/api/login','POST','{\"username\":\"admin\",\"password\":\"***\"}','::1',75,0,'HTTP 401','2026-05-01 18:11:22'),(340,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',13,1,NULL,'2026-05-01 18:12:27'),(341,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',12,1,NULL,'2026-05-01 18:12:28'),(342,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',24,1,NULL,'2026-05-01 18:12:28'),(343,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=5&is_read=0','GET','{\"page\":\"1\",\"pageSize\":\"5\",\"is_read\":\"0\"}','::1',4,1,NULL,'2026-05-01 18:12:29'),(344,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:12:33'),(345,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',6,1,NULL,'2026-05-01 18:12:49'),(346,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',10,1,NULL,'2026-05-01 18:12:49'),(347,1,'admin','出库管理','批量审核出库单','批量审核出库单，成功 0 条，失败 1 条','outbound',NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 18:12:55'),(348,1,'admin','其他','POST /batch-audit',NULL,NULL,NULL,'/api/outbound/order/batch-audit','POST','{\"items\":[{\"id\":3,\"lock_version\":1}]}','::1',17,1,NULL,'2026-05-01 18:12:55'),(349,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 18:12:55'),(350,1,'admin','出库管理','批量审核出库单','批量审核出库单，成功 0 条，失败 1 条','outbound',NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 18:13:03'),(351,1,'admin','其他','POST /batch-audit',NULL,NULL,NULL,'/api/outbound/order/batch-audit','POST','{\"items\":[{\"id\":4,\"lock_version\":2}]}','::1',9,1,NULL,'2026-05-01 18:13:03'),(352,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:13:03'),(353,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',7,1,NULL,'2026-05-01 18:13:07'),(354,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',14,1,NULL,'2026-05-01 18:13:07'),(355,1,'admin','入库管理','批量审核入库单','批量审核入库单，成功 1 条，失败 0 条','inbound',NULL,NULL,'POST',NULL,'::1',NULL,1,NULL,'2026-05-01 18:13:11'),(356,1,'admin','其他','POST /batch-audit',NULL,NULL,NULL,'/api/inbound/order/batch-audit','POST','{\"items\":[{\"id\":12,\"lock_version\":0}]}','::1',19,1,NULL,'2026-05-01 18:13:11'),(357,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 18:13:11'),(358,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=5&is_read=0','GET','{\"page\":\"1\",\"pageSize\":\"5\",\"is_read\":\"0\"}','::1',3,1,NULL,'2026-05-01 18:13:13'),(359,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 18:13:16'),(360,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=20&enabled=1','GET','{\"page\":\"1\",\"pageSize\":\"20\",\"enabled\":\"1\"}','::1',4,1,NULL,'2026-05-01 18:13:16'),(361,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/vehicle/search','GET','{}','::1',4,1,NULL,'2026-05-01 18:13:16'),(362,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/vehicle/search','GET','{}','::1',1,1,NULL,'2026-05-01 18:13:20'),(363,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',2,1,NULL,'2026-05-01 18:13:22'),(364,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',1,1,NULL,'2026-05-01 18:13:27'),(365,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=20&enabled=1','GET','{\"page\":\"1\",\"pageSize\":\"20\",\"enabled\":\"1\"}','::1',3,1,NULL,'2026-05-01 18:13:28'),(366,1,'admin','其他','POST /',NULL,NULL,NULL,'/api/inbound/order','POST','{\"bill_type_code\":\"采购入库\",\"warehouse_code\":\"WH017\",\"supplier_code\":\"SUPP000001\",\"inbound_date\":\"2026-05-01\",\"vehicle_no\":\"浙B123456\",\"container_no\":\"\",\"delivery_no\":\"\",\"remark\":\"\",\"order_no\":\"\",\"lock_version\":0,\"order_status\":\"submit\",\"details\":[{\"uuid\":\"d_1_1777630396312\",\"product_code\":\"101\",\"product_name\":\"100\",\"product_model\":\"100\",\"inbound_qty\":1,\"inbound_weight\":1,\"detail_remark\":\"\"}]}','::1',18,1,NULL,'2026-05-01 18:13:29'),(367,1,'admin','入库管理','提交入库单','提交入库单，单号 IN20260501003','inbound','18',NULL,'POST','{\"bill_type_code\":\"采购入库\",\"warehouse_code\":\"WH017\",\"supplier_code\":\"SUPP000001\",\"inbound_date\":\"2026-05-01\",\"vehicle_no\":\"浙B123456\",\"container_no\":\"\",\"delivery_no\":\"\",\"remark\":\"\",\"order_no\":\"\",\"lock_version\":0,\"order_status\":\"submit\",\"details\":[{\"uuid\":\"d_1_1777630396312\",\"product_code\":\"101\",\"product_name\":\"100\",\"product_model\":\"100\",\"inbound_qty\":1,\"inbound_weight\":1,\"detail_remark\":\"\"}]}','::1',NULL,1,NULL,'2026-05-01 18:13:29'),(368,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 18:13:29'),(369,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',8,1,NULL,'2026-05-01 18:13:29'),(370,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=5&is_read=0','GET','{\"page\":\"1\",\"pageSize\":\"5\",\"is_read\":\"0\"}','::1',3,1,NULL,'2026-05-01 18:13:33'),(371,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:13:34'),(372,1,'admin','其他','GET /recent',NULL,NULL,NULL,'/api/sys/log/recent','GET','{}','::1',3,1,NULL,'2026-05-01 18:13:40'),(373,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',12,1,NULL,'2026-05-01 18:13:40'),(374,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:14:28'),(375,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',12,1,NULL,'2026-05-01 18:14:52'),(376,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',11,1,NULL,'2026-05-01 18:14:52'),(377,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',11,1,NULL,'2026-05-01 18:14:52'),(378,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/check_order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 18:14:52'),(379,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',4,1,NULL,'2026-05-01 18:14:52'),(380,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',3,1,NULL,'2026-05-01 18:14:55'),(381,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',4,1,NULL,'2026-05-01 18:14:56'),(382,1,'admin','其他','GET /type/list',NULL,NULL,NULL,'/api/sys/dict/type/list','GET','{}','::1',4,1,NULL,'2026-05-01 18:14:56'),(383,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 18:14:58'),(384,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:14:59'),(385,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 18:15:00'),(386,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?pageSize=1000','GET','{\"pageSize\":\"1000\"}','::1',6,1,NULL,'2026-05-01 18:15:00'),(387,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:15:00'),(388,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 18:15:01'),(389,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?pageSize=1000','GET','{\"pageSize\":\"1000\"}','::1',5,1,NULL,'2026-05-01 18:15:01'),(390,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:15:02'),(391,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',1,1,NULL,'2026-05-01 18:15:03'),(392,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=5&is_read=0','GET','{\"page\":\"1\",\"pageSize\":\"5\",\"is_read\":\"0\"}','::1',3,1,NULL,'2026-05-01 18:15:06'),(393,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:15:07'),(394,1,'admin','其他','PUT /read-all',NULL,NULL,NULL,'/api/message/read-all','PUT','{}','::1',4,1,NULL,'2026-05-01 18:15:08'),(395,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 18:15:08'),(396,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=5&is_read=0','GET','{\"page\":\"1\",\"pageSize\":\"5\",\"is_read\":\"0\"}','::1',2,1,NULL,'2026-05-01 18:15:12'),(397,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 18:15:15'),(398,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:15:15'),(399,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/message/list?page=1&pageSize=5&is_read=0','GET','{\"page\":\"1\",\"pageSize\":\"5\",\"is_read\":\"0\"}','::1',2,1,NULL,'2026-05-01 18:15:17'),(400,1,'admin','其他','GET /recent',NULL,NULL,NULL,'/api/sys/log/recent','GET','{}','::1',2,1,NULL,'2026-05-01 18:15:18'),(401,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',10,1,NULL,'2026-05-01 18:15:18'),(402,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:16:16'),(403,1,'admin','其他','GET /recent',NULL,NULL,NULL,'/api/sys/log/recent','GET','{}','::1',5,1,NULL,'2026-05-01 18:16:35'),(404,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',14,1,NULL,'2026-05-01 18:16:35'),(405,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',5,1,NULL,'2026-05-01 18:16:35'),(406,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:17:16'),(407,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',7,1,NULL,'2026-05-01 18:19:16'),(408,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',5,1,NULL,'2026-05-01 18:19:45'),(409,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',20,1,NULL,'2026-05-01 18:19:45'),(410,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',6,1,NULL,'2026-05-01 18:20:45'),(411,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',11,1,NULL,'2026-05-01 18:21:10'),(412,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',20,1,NULL,'2026-05-01 18:21:10'),(413,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',8,1,NULL,'2026-05-01 18:21:11'),(414,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',4,1,NULL,'2026-05-01 18:21:11'),(415,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',8,1,NULL,'2026-05-01 18:21:13'),(416,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',19,1,NULL,'2026-05-01 18:21:13'),(417,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',13,1,NULL,'2026-05-01 18:21:13'),(418,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:21:45'),(419,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:22:45'),(420,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:23:45'),(421,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',11,1,NULL,'2026-05-01 18:23:53'),(422,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',12,1,NULL,'2026-05-01 18:23:53'),(423,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',12,1,NULL,'2026-05-01 18:23:53'),(424,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',8,1,NULL,'2026-05-01 18:23:53'),(425,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',8,1,NULL,'2026-05-01 18:24:54'),(426,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',17,1,NULL,'2026-05-01 18:25:02'),(427,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',14,1,NULL,'2026-05-01 18:25:02'),(428,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',16,1,NULL,'2026-05-01 18:25:02'),(429,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',17,1,NULL,'2026-05-01 18:25:02'),(430,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',6,1,NULL,'2026-05-01 18:25:04'),(431,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',5,1,NULL,'2026-05-01 18:25:04'),(432,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',7,1,NULL,'2026-05-01 18:25:04'),(433,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',7,1,NULL,'2026-05-01 18:25:04'),(434,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',15,0,'HTTP 500','2026-05-01 18:25:09'),(435,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',2,1,NULL,'2026-05-01 18:25:17'),(436,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',12,0,'HTTP 500','2026-05-01 18:25:17'),(437,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:26:18'),(438,NULL,'anonymous','其他','GET /',NULL,NULL,NULL,'/api/dashboard','GET','{}','::1',3,0,'HTTP 401','2026-05-01 18:27:05'),(439,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',8,1,NULL,'2026-05-01 18:27:17'),(440,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',6,1,NULL,'2026-05-01 18:27:30'),(441,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',31,1,NULL,'2026-05-01 18:27:30'),(442,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:28:30'),(443,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:29:30'),(444,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:30:30'),(445,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',5,1,NULL,'2026-05-01 18:31:30'),(446,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:32:30'),(447,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:33:30'),(448,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:35:04'),(449,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:36:05'),(450,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:37:06'),(451,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:37:14'),(452,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',20,1,NULL,'2026-05-01 18:37:14'),(453,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:38:15'),(454,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:39:15'),(455,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:40:15'),(456,NULL,'anonymous','其他','GET /api/sys/config/list',NULL,NULL,NULL,'/api/sys/config/list','GET','{}','::1',2,0,'HTTP 404','2026-05-01 18:40:18'),(457,NULL,'anonymous','其他','GET /api/dashboard/stats',NULL,NULL,NULL,'/api/dashboard/stats','GET','{}','::1',3,0,'HTTP 404','2026-05-01 18:40:58'),(458,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',8,1,NULL,'2026-05-01 18:41:15'),(459,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/config/list','GET','{}','::1',4,1,NULL,'2026-05-01 18:41:23'),(460,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',5,1,NULL,'2026-05-01 18:42:15'),(461,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:43:15'),(462,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:44:20'),(463,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:45:20'),(464,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 18:45:22'),(465,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',27,1,NULL,'2026-05-01 18:45:22'),(466,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',2,1,NULL,'2026-05-01 18:45:29'),(467,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',14,1,NULL,'2026-05-01 18:45:29'),(468,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 18:45:44'),(469,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',16,1,NULL,'2026-05-01 18:45:44'),(470,1,'admin','其他','GET /monthly-summary',NULL,NULL,NULL,'/api/report/monthly-summary?year=2026','GET','{\"year\":\"2026\"}','::1',11,1,NULL,'2026-05-01 18:46:27'),(471,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-01-01&endDate=2026-05-01','GET','{\"startDate\":\"2026-01-01\",\"endDate\":\"2026-05-01\"}','::1',3,1,NULL,'2026-05-01 18:46:37'),(472,1,'admin','其他','GET /template',NULL,NULL,NULL,'/api/stock/template','GET','{}','::1',33,1,NULL,'2026-05-01 18:50:23'),(473,NULL,'anonymous','其他','GET /',NULL,NULL,NULL,'/api/dashboard','GET','{}','::1',3,0,'HTTP 401','2026-05-01 19:00:15'),(474,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',6,1,NULL,'2026-05-01 19:01:57'),(475,1,'admin','其他','GET /',NULL,NULL,NULL,'/api/dashboard?days=7','GET','{\"days\":\"7\"}','::1',33,1,NULL,'2026-05-01 19:01:57'),(476,1,'admin','其他','GET /monthly-summary',NULL,NULL,NULL,'/api/report/monthly-summary?year=2026','GET','{\"year\":\"2026\"}','::1',6,1,NULL,'2026-05-01 19:01:59'),(477,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=999','GET','{\"pageSize\":\"999\"}','::1',3,1,NULL,'2026-05-01 19:01:59'),(478,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\"}','::1',5,1,NULL,'2026-05-01 19:02:33'),(479,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\"}','::1',2,1,NULL,'2026-05-01 19:02:34'),(480,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\"}','::1',3,1,NULL,'2026-05-01 19:02:35'),(481,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08&warehouse_code=WH017','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\",\"warehouse_code\":\"WH017\"}','::1',3,1,NULL,'2026-05-01 19:02:36'),(482,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08&warehouse_code=WH017','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\",\"warehouse_code\":\"WH017\"}','::1',3,1,NULL,'2026-05-01 19:02:37'),(483,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08&warehouse_code=WH009','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\",\"warehouse_code\":\"WH009\"}','::1',2,1,NULL,'2026-05-01 19:02:38'),(484,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08&warehouse_code=WH009','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\",\"warehouse_code\":\"WH009\"}','::1',2,1,NULL,'2026-05-01 19:02:39'),(485,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08&warehouse_code=WH001','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\",\"warehouse_code\":\"WH001\"}','::1',2,1,NULL,'2026-05-01 19:02:40'),(486,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-05-01&endDate=2026-05-08&warehouse_code=WH001','GET','{\"startDate\":\"2026-05-01\",\"endDate\":\"2026-05-08\",\"warehouse_code\":\"WH001\"}','::1',3,1,NULL,'2026-05-01 19:02:41'),(487,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 19:02:58'),(488,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',8,1,NULL,'2026-05-01 19:03:24'),(489,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/product/category/list','GET','{}','::1',8,1,NULL,'2026-05-01 19:03:24'),(490,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 19:03:30'),(491,1,'admin','其他','GET /data/supplier_type',NULL,NULL,NULL,'/api/sys/dict/data/supplier_type','GET','{}','::1',6,1,NULL,'2026-05-01 19:03:31'),(492,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/supplier/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 19:03:31'),(493,1,'admin','其他','GET /data/cooperation_status',NULL,NULL,NULL,'/api/sys/dict/data/cooperation_status','GET','{}','::1',6,1,NULL,'2026-05-01 19:03:31'),(494,1,'admin','其他','GET /data/supplier_level',NULL,NULL,NULL,'/api/sys/dict/data/supplier_level','GET','{}','::1',10,1,NULL,'2026-05-01 19:03:31'),(495,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/customer/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 19:03:31'),(496,1,'admin','其他','GET /data/customer_level',NULL,NULL,NULL,'/api/sys/dict/data/customer_level','GET','{}','::1',2,1,NULL,'2026-05-01 19:03:31'),(497,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/vehicle/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 19:03:32'),(498,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 19:03:33'),(499,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 19:03:33'),(500,1,'admin','其他','GET /18',NULL,NULL,NULL,'/api/inbound/order/18','GET','{}','::1',4,1,NULL,'2026-05-01 19:03:40'),(501,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/inbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',5,1,NULL,'2026-05-01 19:03:46'),(502,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',2,1,NULL,'2026-05-01 19:03:46'),(503,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',5,1,NULL,'2026-05-01 19:03:48'),(504,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/outbound/order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',9,1,NULL,'2026-05-01 19:03:48'),(505,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 19:03:49'),(506,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',4,1,NULL,'2026-05-01 19:03:49'),(507,1,'admin','其他','GET /search','远程搜索',NULL,NULL,'/api/product/search','GET','{}','::1',4,1,NULL,'2026-05-01 19:03:49'),(508,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/stock/check_order/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',4,1,NULL,'2026-05-01 19:03:53'),(509,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=1000&enabled=1','GET','{\"pageSize\":\"1000\",\"enabled\":\"1\"}','::1',3,1,NULL,'2026-05-01 19:03:53'),(510,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',2,1,NULL,'2026-05-01 19:03:57'),(511,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/user/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',7,1,NULL,'2026-05-01 19:04:01'),(512,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?pageSize=1000','GET','{\"pageSize\":\"1000\"}','::1',5,1,NULL,'2026-05-01 19:04:01'),(513,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/role/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',2,1,NULL,'2026-05-01 19:04:01'),(514,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/log/list?page=1&pageSize=10','GET','{\"page\":\"1\",\"pageSize\":\"10\"}','::1',3,1,NULL,'2026-05-01 19:04:02'),(515,1,'admin','其他','GET /type/list',NULL,NULL,NULL,'/api/sys/dict/type/list','GET','{}','::1',2,1,NULL,'2026-05-01 19:04:05'),(516,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',2,1,NULL,'2026-05-01 19:04:07'),(517,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',3,1,NULL,'2026-05-01 19:04:08'),(518,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/bill-config/list','GET','{}','::1',2,1,NULL,'2026-05-01 19:04:09'),(519,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/print/template/list','GET','{}','::1',2,1,NULL,'2026-05-01 19:04:11'),(520,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/config/list','GET','{}','::1',2,1,NULL,'2026-05-01 19:04:13'),(521,1,'admin','其他','GET /groups',NULL,NULL,NULL,'/api/sys/config/groups','GET','{}','::1',3,1,NULL,'2026-05-01 19:04:13'),(522,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/sys/scheduled-task/list','GET','{}','::1',5,1,NULL,'2026-05-01 19:04:31'),(523,1,'admin','其他','GET /status',NULL,NULL,NULL,'/api/health/status','GET','{}','::1',22,1,NULL,'2026-05-01 19:04:34'),(524,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/backup/list','GET','{}','::1',1,1,NULL,'2026-05-01 19:04:56'),(525,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',2,1,NULL,'2026-05-01 19:04:57'),(526,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/backup/list','GET','{}','::1',NULL,1,NULL,'2026-05-01 19:04:59'),(527,1,'admin','其他','POST /create',NULL,NULL,NULL,'/api/backup/create','POST','{}','::1',195,1,NULL,'2026-05-01 19:05:01'),(528,1,'admin','其他','POST /create',NULL,NULL,NULL,'/api/backup/create','POST','{}','::1',169,1,NULL,'2026-05-01 19:05:31'),(529,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',5,1,NULL,'2026-05-01 19:05:57'),(530,1,'admin','其他','GET /monthly-summary',NULL,NULL,NULL,'/api/report/monthly-summary?year=2026','GET','{\"year\":\"2026\"}','::1',5,1,NULL,'2026-05-01 19:06:46'),(531,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=999','GET','{\"pageSize\":\"999\"}','::1',5,1,NULL,'2026-05-01 19:06:47'),(532,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-04-29&endDate=2026-05-01','GET','{\"startDate\":\"2026-04-29\",\"endDate\":\"2026-05-01\"}','::1',4,1,NULL,'2026-05-01 19:06:53'),(533,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',1,1,NULL,'2026-05-01 19:06:57'),(534,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-04-29&endDate=2026-05-01&warehouse_code=WH017','GET','{\"startDate\":\"2026-04-29\",\"endDate\":\"2026-05-01\",\"warehouse_code\":\"WH017\"}','::1',2,1,NULL,'2026-05-01 19:07:04'),(535,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-04-29&endDate=2026-05-01&warehouse_code=WH017','GET','{\"startDate\":\"2026-04-29\",\"endDate\":\"2026-05-01\",\"warehouse_code\":\"WH017\"}','::1',2,1,NULL,'2026-05-01 19:07:05'),(536,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-04-29&endDate=2026-05-01&warehouse_code=WH009','GET','{\"startDate\":\"2026-04-29\",\"endDate\":\"2026-05-01\",\"warehouse_code\":\"WH009\"}','::1',2,1,NULL,'2026-05-01 19:07:06'),(537,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-04-29&endDate=2026-05-01&warehouse_code=WH001','GET','{\"startDate\":\"2026-04-29\",\"endDate\":\"2026-05-01\",\"warehouse_code\":\"WH001\"}','::1',3,1,NULL,'2026-05-01 19:07:07'),(538,1,'admin','其他','GET /turnover',NULL,NULL,NULL,'/api/report/turnover?startDate=2026-04-29&endDate=2026-05-01','GET','{\"startDate\":\"2026-04-29\",\"endDate\":\"2026-05-01\"}','::1',2,1,NULL,'2026-05-01 19:07:08'),(539,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 19:07:58'),(540,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 19:08:59'),(541,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',7,1,NULL,'2026-05-01 19:10:00'),(542,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',6,1,NULL,'2026-05-01 19:11:01'),(543,1,'admin','其他','POST /create',NULL,NULL,NULL,'/api/backup/create','POST','{}','::1',177,1,NULL,'2026-05-01 19:11:33'),(544,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/warehouse/list?pageSize=999','GET','{\"pageSize\":\"999\"}','::1',12,1,NULL,'2026-05-01 19:13:04'),(545,1,'admin','其他','GET /monthly-summary',NULL,NULL,NULL,'/api/report/monthly-summary?year=2026','GET','{\"year\":\"2026\"}','::1',20,1,NULL,'2026-05-01 19:13:04'),(546,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 19:13:05'),(547,NULL,'anonymous','其他','GET /',NULL,NULL,NULL,'/api/dashboard','GET','{}','::1',1,0,'HTTP 401','2026-05-01 19:13:12'),(548,1,'admin','其他','GET /list',NULL,NULL,NULL,'/api/backup/list','GET','{}','::1',2,1,NULL,'2026-05-01 19:13:15'),(549,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',3,1,NULL,'2026-05-01 19:14:05'),(550,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 19:15:05'),(551,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 19:16:05'),(552,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 19:17:05'),(553,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',5,1,NULL,'2026-05-01 19:18:05'),(554,1,'admin','其他','GET /unread-count',NULL,NULL,NULL,'/api/message/unread-count','GET','{}','::1',4,1,NULL,'2026-05-01 19:19:05');
/*!40000 ALTER TABLE `sys_operation_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_permission`
--

DROP TABLE IF EXISTS `sys_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `perm_code` varchar(100) NOT NULL COMMENT '鏉冮檺缂栫爜锛屽? inbound:audit, outbound:audit, stock:check',
  `perm_name` varchar(50) NOT NULL,
  `parent_id` bigint DEFAULT '0',
  `type` char(1) DEFAULT 'M' COMMENT 'M-鑿滃崟, B-鎸夐挳',
  `sort_order` int DEFAULT '0',
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_perm_code` (`perm_code`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鏉冮檺琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_permission`
--

LOCK TABLES `sys_permission` WRITE;
/*!40000 ALTER TABLE `sys_permission` DISABLE KEYS */;
INSERT INTO `sys_permission` VALUES (1,'inbound','入库管理',0,'M',1,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(2,'outbound','出库管理',0,'M',2,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(3,'stock','库存管理',0,'M',3,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(4,'basic','基础资料',0,'M',4,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(5,'system','系统管理',0,'M',5,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(13,'inbound:create','创建入库单',1,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(14,'inbound:edit','编辑入库单',1,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(15,'inbound:audit','审核入库单',1,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(16,'outbound:create','创建出库单',2,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(17,'outbound:edit','编辑出库单',2,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(18,'outbound:audit','审核出库单',2,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(19,'stock:view','查看库存',3,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(20,'stock:export','导出库存',3,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(21,'stock:check','库存盘点调整',3,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(22,'basic:view','查看基础资料',4,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(23,'basic:edit','编辑基础资料',4,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0),(24,'base:manage','基础资料管理',4,'B',0,NULL,NULL,'2026-05-01 10:59:23',NULL,'2026-05-01 10:59:23',0);
/*!40000 ALTER TABLE `sys_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_role`
--

DROP TABLE IF EXISTS `sys_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_code` varchar(50) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  UNIQUE KEY `role_code` (`role_code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='瑙掕壊琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_role`
--

LOCK TABLES `sys_role` WRITE;
/*!40000 ALTER TABLE `sys_role` DISABLE KEYS */;
INSERT INTO `sys_role` VALUES (1,'ADMIN','系统管理员','拥有所有权限',NULL,'2026-04-30 17:29:00',NULL,'2026-04-30 17:29:00',0),(2,'OPERATOR','操作员','只能创建单据、查看库存，不能审核',NULL,'2026-04-30 17:29:00',NULL,'2026-04-30 17:29:00',0),(3,'AUDITOR','审核员','可以审核出入库单据，不能创建',NULL,'2026-04-30 17:29:00',NULL,'2026-04-30 17:29:00',0);
/*!40000 ALTER TABLE `sys_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_role_permission`
--

DROP TABLE IF EXISTS `sys_role_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_role_permission` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` bigint NOT NULL,
  `perm_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_perm_id` (`perm_id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='瑙掕壊鏉冮檺鍏宠仈琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_role_permission`
--

LOCK TABLES `sys_role_permission` WRITE;
/*!40000 ALTER TABLE `sys_role_permission` DISABLE KEYS */;
INSERT INTO `sys_role_permission` VALUES (29,1,1),(30,1,2),(31,1,3),(32,1,4),(33,1,5),(34,1,13),(35,1,14),(36,1,15),(37,1,16),(38,1,17),(39,1,18),(40,1,19),(41,1,20),(42,1,21),(43,1,22),(44,1,23),(45,1,24),(46,2,13),(47,2,14),(48,2,16),(49,2,17),(50,2,19),(51,2,22),(52,3,15),(53,3,18),(54,3,19),(55,3,22);
/*!40000 ALTER TABLE `sys_role_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_user`
--

DROP TABLE IF EXISTS `sys_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nickname` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `status` tinyint DEFAULT '1',
  `remark` varchar(200) DEFAULT NULL,
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT NULL,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='绯荤粺鐢ㄦ埛琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_user`
--

LOCK TABLES `sys_user` WRITE;
/*!40000 ALTER TABLE `sys_user` DISABLE KEYS */;
INSERT INTO `sys_user` VALUES (1,'admin','$2b$10$4arHn/MpKUGzH53tiwtGfObPhsbLVDvy2OxMdmy2FWVVAkwDmm4fm','超级管理员',NULL,NULL,'/public/avatars/avatar_1_1777605395841.png',1,NULL,NULL,'2026-04-30 17:29:30','admin','2026-04-30 17:29:30',0),(2,'operator','$2b$10$4arHn/MpKUGzH53tiwtGfObPhsbLVDvy2OxMdmy2FWVVAkwDmm4fm','操作员',NULL,NULL,'/public/default-avatars/3.svg',1,NULL,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(3,'auditor','$2b$10$4arHn/MpKUGzH53tiwtGfObPhsbLVDvy2OxMdmy2FWVVAkwDmm4fm','审核员',NULL,NULL,'/public/default-avatars/4.svg',1,NULL,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(4,'113','$2b$10$L3WFsjjc9AGwohLCFilvYOj/9.l5WjZkEjo2kmlA/nmyf9Bx6mRfS','测试','','','/public/default-avatars/4.svg',1,'','admin','2026-05-01 05:17:22',NULL,'2026-05-01 05:17:22',0);
/*!40000 ALTER TABLE `sys_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sys_user_role`
--

DROP TABLE IF EXISTS `sys_user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sys_user_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `sys_user_role_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sys_user_role_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='鐢ㄦ埛瑙掕壊鍏宠仈琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sys_user_role`
--

LOCK TABLES `sys_user_role` WRITE;
/*!40000 ALTER TABLE `sys_user_role` DISABLE KEYS */;
INSERT INTO `sys_user_role` VALUES (1,1,1),(2,2,2),(3,3,3),(4,4,2);
/*!40000 ALTER TABLE `sys_user_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `plate_number` varchar(20) NOT NULL COMMENT '杞﹀彿锛堝敮涓?級',
  `contact_name` varchar(50) DEFAULT NULL COMMENT '鑱旂郴浜',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '鐢佃瘽',
  `status` tinyint DEFAULT '1' COMMENT '鐘舵?锛?鍙?敤/2缁翠慨/3鍋滅敤锛',
  `remark` varchar(200) DEFAULT NULL COMMENT '澶囨敞',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_plate_number` (`plate_number`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='杞﹁締琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle`
--

LOCK TABLES `vehicle` WRITE;
/*!40000 ALTER TABLE `vehicle` DISABLE KEYS */;
INSERT INTO `vehicle` VALUES (1,'浙BD24229','','',1,'','admin','2026-04-30 11:03:19',NULL,'2026-04-30 11:03:19',0),(2,'','','',1,'','admin','2026-04-30 11:48:24','admin','2026-04-30 11:48:27',1),(3,'测试','','',1,'','admin','2026-04-30 12:43:49',NULL,'2026-04-30 12:43:49',0),(6,'测试1','','',1,'','admin','2026-04-30 13:10:41',NULL,'2026-04-30 13:10:41',0),(9,'浙B123456','','',1,'','admin','2026-04-30 13:48:47',NULL,'2026-04-30 13:48:47',0);
/*!40000 ALTER TABLE `vehicle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse`
--

DROP TABLE IF EXISTS `warehouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '涓婚敭',
  `warehouse_code` varchar(50) NOT NULL COMMENT '浠撳簱缂栫爜锛堝敮涓?級',
  `warehouse_name` varchar(100) NOT NULL COMMENT '浠撳簱鍚嶇О',
  `manager` varchar(50) DEFAULT NULL COMMENT '绠＄悊鍛',
  `capacity` decimal(10,2) DEFAULT NULL COMMENT '瀹归噺(鍚?',
  `location` varchar(200) DEFAULT NULL COMMENT '浣嶇疆',
  `contact_phone` varchar(20) DEFAULT NULL COMMENT '鑱旂郴鐢佃瘽',
  `warehouse_type` varchar(50) DEFAULT NULL COMMENT '绫诲瀷',
  `is_enabled` tinyint DEFAULT '1' COMMENT '鏄?惁鍚?敤',
  `create_by` varchar(50) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_by` varchar(50) DEFAULT NULL,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `del_flag` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_code` (`warehouse_code`),
  UNIQUE KEY `uk_warehouse_name` (`warehouse_name`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='浠撳簱琛';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse`
--

LOCK TABLES `warehouse` WRITE;
/*!40000 ALTER TABLE `warehouse` DISABLE KEYS */;
INSERT INTO `warehouse` VALUES (1,'WH001','一号仓库','张三',500.00,'A区1号','13800001111','普通仓',1,NULL,'2026-04-30 17:29:30',NULL,'2026-04-30 17:29:30',0),(18,'WH005','测试2','',NULL,'','','',0,'admin','2026-04-30 11:46:59','admin','2026-04-30 12:38:31',1),(21,'WH008','阿斯顿发山东','',NULL,'','','',1,'admin','2026-04-30 11:49:19','admin','2026-04-30 11:49:22',1),(22,'WH009','测试','测试',1.00,'测试','测试','测色',0,'admin','2026-04-30 12:38:42','admin','2026-04-30 16:15:00',0),(30,'WH017','测试12','',NULL,'','','',1,'admin','2026-04-30 13:48:08',NULL,'2026-04-30 13:48:08',0);
/*!40000 ALTER TABLE `warehouse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'wms'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-01 19:19:32
