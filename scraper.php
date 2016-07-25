<?php

error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);
libxml_use_internal_errors(true);

$years = [2011, 2012, 2013, 2014, 2015, 2016];

if (!is_dir('data_cache')) { mkdir('data_cache'); }
if (!is_dir('app/json')) { mkdir('app/json'); }

foreach ($years as $year) {
    if (!file_exists('data_cache/' . $year . '.cache')) {
        $year_data = file_get_contents('http://www.thereligionofpeace.com/attacks/attacks.aspx?Yr=' . $year);

        $year_data_exploded = explode('<!-- Begin Attacks Table-->', $year_data);
        $year_data_content_plus_broken_footer_exploded = explode('</table>', $year_data_exploded[1]);

        $cleaned_data = $year_data_content_plus_broken_footer_exploded[0] . '</table>';

        file_put_contents('data_cache/' . $year . '.cache', $cleaned_data);
    }
}

foreach ($years as $year) {
    if (!file_exists('app/json/' . $year . '.json')) {
        $file_contents = '<html><body>' . file_get_contents('data_cache/' . $year . '.cache') . '</body></html>';
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

        file_put_contents('app/json/' . $year . '.json', json_encode($objects, JSON_PRETTY_PRINT));
    }
}


foreach ($years as $year) {
    if (file_exists('app/json/' . $year . '.json')) {
        $html_data = file_get_contents('app/json/' . $year . '.json');
        $html_data = str_replace("\r\n                  ", '', $html_data);
        $objects = json_decode($html_data, TRUE);

        foreach ($objects as &$object) {
            if (!isset($object['geo'])) {
                $object['geo'] = get_geo($object);
            }
        }

        file_put_contents('app/json/' . $year . '.json', json_encode($objects, JSON_PRETTY_PRINT));
    }
}

function get_geo($object) {
    $geo_cache = [];
    if (file_exists('data_cache/geo.cache')) {
        $geo_cache = json_decode(file_get_contents('data_cache/geo.cache'), TRUE);
    }
    if (!$geo_cache) {
        $geo_cache = [];
    }

    if (isset($geo_cache[$object['country']][$object['city']])) {
        return $geo_cache[$object['country']][$object['city']];
    }


    if (isset($geo_cache[$object['country']]['COUNTRY'])) {
        return $geo_cache[$object['country']]['COUNTRY'];
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
    return preg_replace(array_keys($utf8), array_values($utf8), $text);
}