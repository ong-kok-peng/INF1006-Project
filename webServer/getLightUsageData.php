<?php
//mysql connection info
$servername = "localhost";
$username = "homeAutoUser";
$password = "12345678";
$dbname = "homeAutoServer";
$tableName = "roomsLightUsage";

$queryResult = ["status"=>"", "errormessage"=>"", "lightUsageData"=>[ "labels"=>[], "rooms"=>[] ]];
$roomFilters = []; $roomFiltersToSql = "";
$labelFilters = []; $labelFiltersToSql = "*";

header('Content-Type: application/json');
$queryData = json_decode(file_get_contents("php://input"), true);

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    //get light usage data labels
    $lightUsageLabels = $conn->query("SHOW COLUMNS FROM {$tableName}");
    while ($row = $lightUsageLabels->fetch(PDO::FETCH_ASSOC)) {
        $label = $row["Field"];
        if ($label != "id" && $label != "date" && $label != "room") {
            $queryResult["lightUsageData"]["labels"][] = $label;
        }
    }
    
    //get all the usage data with filter(s) applied if applicable
    if (!empty($queryData["roomNames"])) { 
        $roomFilters = $queryData["roomNames"]; 
        $roomFiltersToSql = "WHERE room IN ('" . implode('\',\'', $roomFilters) . "')"; 
    }
    if (!empty($queryData["labels"])) { 
        $labelFilters = $queryData["labels"]; 
        $labelFiltersToSql = "id, date, room, " . implode(',', $labelFilters); 
    }

    $sql = "SELECT {$labelFiltersToSql} FROM {$tableName} {$roomFiltersToSql}";
    //echo $sql;

    $lightUsageData = $conn->query($sql);
    while ($row = $lightUsageData->fetch(PDO::FETCH_ASSOC)) {
        $rowObj = [];
        foreach ($row as $label => $value) {
            $rowObj[$label] = $value;
        }
        $queryResult["lightUsageData"]["rooms"][$row["room"]][] = $rowObj;
    }

    $queryResult["status"] = "ok";
    echo json_encode($queryResult);

}
catch(PDOException $e) {
    $queryResult["status"] = "error";
    $queryResult["errormessage"] = "light usage stats not available because of SQL error.";
    echo json_encode($queryResult);
}

$conn = null;
?>