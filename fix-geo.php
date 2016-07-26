<?php

error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);
libxml_use_internal_errors(true);

define('CARTO_APIKEY', '7a21536f8d4e92fae1a647e6bf47355b95d49df3');
define('CARTO_URL', 'http://danielbeeke.carto.com/api/v2/sql?q=');

$items_to_geocode_query = 'SELECT * FROM islamic_extremism WHERE the_geom IS NULL ORDER BY cartodb_id ASC LIMIT 3000';

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
        print 'Could not find: ' . $object['city'] . ' in ' . $object['country'] . ' trying google.';

        $location = $object['city'] . ',' . $object['country'];
        $location = urlencode(cleanString($location));
        $geo_result = json_decode(file_get_contents('https://maps.google.com/maps/api/geocode/json?key=AIzaSyBbvfdgUmI8t8289qFA-_o5yw4har1F0g8&address=' . cleanString($object['city']) . '&components=country:' . cleanString($object['country'])), TRUE);

        if (isset($geo_result['results'][0]['geometry']['location'])) {
            $object['geo'] = $geo_result['results'][0]['geometry']['location'];
        }
    }

    if (isset($object['geo'])) {
        $query = urlencode('UPDATE islamic_extremism ' .
                'SET the_geom = ST_GeomFromText(\'POINT(' . $object['geo']['lng'] . ' ' . $object['geo']['lat'] . ')\', 4326) ' .
                'WHERE cartodb_id = ' . $object['cartodb_id']);

        $api = CARTO_URL . $query . '&api_key=' . CARTO_APIKEY;

        print $api . "\n\n";

        file_get_contents($api);
    }
}


function cleanString($text) {
    $utf8 = array(
        '/[áàâãªäa]/u'   =>   'a',
        '/[ÁÀÂÃÄ]/u'    =>   'A',
        '/[ÍÌÎÏ]/u'     =>   'I',
        '/[íìîï]/u'     =>   'i',
        '/[éèêë]/u'     =>   'e',
        '/[ÉÈÊË]/u'     =>   'E',
        '/[óòôõºö]/u'   =>   'o',
        '/[ÓÒÔÕÖ]/u'    =>   'O',
        '/[úùûü]/u'     =>   'u',
        '/[ÚÙÛÜ]/u'     =>   'U',
        '/ç/'           =>   'c',
        '/Ç/'           =>   'C',
        '/ñ/'           =>   'n',
        '/Ñ/'           =>   'N',
        '/–/'           =>   '-', // UTF-8 hyphen to "normal" hyphen
        '/[’‘‹›‚]/u'    =>   ' ', // Literally a single quote
        '/[“”«»„]/u'    =>   ' ', // Double quote
        '/  /'           =>   ' ', // nonbreaking space (equiv. to 0x160)
    );
    return urlencode(preg_replace(array_keys($utf8), array_values($utf8), $text));
}


