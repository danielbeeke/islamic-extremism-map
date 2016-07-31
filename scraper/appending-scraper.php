<?php

error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);
libxml_use_internal_errors(true);

define('CARTO_APIKEY', '7a21536f8d4e92fae1a647e6bf47355b95d49df3');
define('CARTO_URL', 'http://danielbeeke.carto.com/api/v2/sql?q=');

function downloadCurrentYearHtml() {
    $year = 2016;

    $year_data = file_get_contents('http://www.thereligionofpeace.com/attacks/attacks.aspx?Yr=' . $year);

    $year_data_exploded = explode('<!-- Begin Attacks Table-->', $year_data);
    $year_data_content_plus_broken_footer_exploded = explode('</table>', $year_data_exploded[1]);

    $cleaned_data = $year_data_content_plus_broken_footer_exploded[0] . '</table>';
    $cleaned_data = str_replace("\r\n                  m", '', $cleaned_data);
    return $cleaned_data;
}

function parseHtmlToObjects ($html) {
    $file_contents = '<html><body>' . $html . '</body></html>';
    $objects = [];

    $doc = new DOMDocument();
    $doc->loadHTML($file_contents);

    $delta_mapping = [
        0 => 'date',
        2 => 'country',
        4 => 'city',
        6 => 'killed',
        8 => 'injured',
        10 => 'description'
    ];

    foreach($doc->getElementsByTagName('tr') as $row_delta => $row) {
        if ($row_delta > 0) {
            $row_object = [];

            foreach ($row->childNodes as $delta => $td) {
                if (isset($delta_mapping[$delta])) {
                    $value = trim($td->nodeValue);

                    if ($delta == 0) {
                        $value = str_replace('.', '-', $value);
                    }

                    $row_object[$delta_mapping[$delta]] = $value;
                }
            }

            $objects[] = $row_object;
        }
    }

    return array_reverse($objects);
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
    return preg_replace(array_keys($utf8), array_values($utf8), $text);
}

function getLastAddedItemDate() {
    $most_recent_date_query = 'SELECT date FROM islamic_extremism ORDER BY date DESC LIMIT 1';
    $recent_date_result = json_decode(file_get_contents(CARTO_URL . urlencode($most_recent_date_query)), TRUE);
    if (isset($recent_date_result['rows'][0]['date'])) {
        $last_date = strtotime($recent_date_result['rows'][0]['date']);
    }
    else {
        $last_date = 0;
    }
    return $last_date;
}

function additemsToCarto() {
    $last_item_date = getLastAddedItemDate();
    $values = array();
    $objects = parseHtmlToObjects(downloadCurrentYearHtml());

    foreach ($objects as $object) {
        $location_timestamp = strtotime($object['date']);
        $location_date = date('m-d-Y', $location_timestamp);

        if ($location_timestamp > $last_item_date) {
            $values[] = urlencode("('" . str_replace("'", '’', $object['city']) . "'," .
                "'" . str_replace("'", '’', $object['country']) . "'," .
                "'" . $location_date . "'," .
                "'" . str_replace("'", '’', $object['description']) . "'," .
                "'" . str_replace("'", '’', $object['injured']) . "'," .
                "'" . str_replace("'", '’', $object['killed']) . "'" .
                ')');
        }
    }

    $chunks = array_chunk($values, 4);

    foreach ($chunks as $index => $chunk) {
        $query = urlencode('INSERT INTO islamic_extremism ' .
                '(city, country, date, description, injured, killed) ' .
                'VALUES ') . implode(',', $chunk);

        $api = CARTO_URL . $query . '&api_key=' . CARTO_APIKEY;

        file_get_contents($api);

        print $index . " done. \n\n";
    }
}

additemsToCarto();
