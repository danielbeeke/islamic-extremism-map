<?php

error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);
libxml_use_internal_errors(true);

define('CARTO_APIKEY', '7a21536f8d4e92fae1a647e6bf47355b95d49df3');
define('CARTO_URL', 'http://danielbeeke.carto.com/api/v2/sql?q=');

$items_to_geocode_query = 'SELECT * FROM islamic_extremism WHERE cartodb_georef_status = false ORDER BY cartodb_id ASC LIMIT 100';
$items_to_geocode = json_decode(file_get_contents(CARTO_URL . urlencode($items_to_geocode_query)), TRUE);
$geo_cache = json_decode(file_get_contents('data_cache/geo.cache'), TRUE);

foreach ($items_to_geocode['rows'] as $object) {
    if (isset($geo_cache[$object['country']][$object['city']])) {
        $object['geo'] = $geo_cache[$object['country']][$object['city']];
    }
    elseif (isset($geo_cache[$object['country']]['COUNTRY'])) {
        $object['geo'] = $geo_cache[$object['country']]['COUNTRY'];
    }
    else {
        print 'Could not find: ' . $object['city'] . ' in ' . $object['country'];
    }
}
