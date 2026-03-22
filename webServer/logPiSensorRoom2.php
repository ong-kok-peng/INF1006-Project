<?php
//mysql connection info
$servername = "localhost";
$username = "homeAutoUser";
$password = "12345678";
$dbname = "homeAutoServer";
$tableName = "room2LightEvents";

$logResult = ["status"=>"", "errormessage"=>"", "message"=>""];

header('Content-Type: application/json');
$logData = json_decode(file_get_contents("php://input"), true);

if (!empty($logData) && !empty($logData["logEvent"])) {
    $date = date("d/m/y");
    $time = date("H:i:s");
    $logEvent = $logData["logEvent"];

    $logFields = ["date", "time"]; 
    $logValues = [$date, $time]; 
    $logValPlaceholders = ['?', '?'];

    foreach ($logData as $key => $value) {
        $logFields[] = $key;
        $logValues[] = $value;
        $logValPlaceholders[] = '?';
    }
    
    $fieldsToSql = implode(',', $logFields);
    $placeholdersToSql = implode(',', $logValPlaceholders);
    $sql = "INSERT INTO {$tableName} ({$fieldsToSql}) VALUES ({$placeholdersToSql})";
    //echo $sql;
    //print_r($logValues);

    try {
        $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $sqlQuery = $conn->prepare($sql);
        $sqlQuery->execute($logValues);

        $logResult["status"] = "ok";
        $logResult["message"] = "sensor log \"{$logEvent}\" is created!";
        echo json_encode($logResult);
    } 
    catch(PDOException $e){
        $logResult["status"] = "error";
        $logResult["errormessage"] = "sensor log \"{$logEvent}\" cannot be created because of SQL error!";
        echo json_encode($logResult);
        //die("MySQL error; " . $e->getMessage());
    }
    
}
else {
    $logResult["status"] = "error";
    $logResult["errormessage"] = "Bad logging request; data missing or incorrect.";
    echo json_encode($logResult);
}
?>