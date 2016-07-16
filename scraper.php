<?php

error_reporting(E_ALL);
ini_set('display_errors', TRUE);
ini_set('display_startup_errors', TRUE);
libxml_use_internal_errors(true);

$years = [2011, 2012, 2013, 2014, 2015, 2016];

if (!is_dir('.tmp')) { mkdir('.tmp'); }
if (!is_dir('app/json')) { mkdir('app/json'); }

foreach ($years as $year) {
    if (!file_exists('.tmp/' . $year . '.cache')) {
        $year_data = file_get_contents('http://www.thereligionofpeace.com/attacks/attacks.aspx?Yr=' . $year);

        $year_data_exploded = explode('<!-- Begin Attacks Table-->', $year_data);
        $year_data_content_plus_broken_footer_exploded = explode('</table>', $year_data_exploded[1]);

        $cleaned_data = $year_data_content_plus_broken_footer_exploded[0] . '</table>';

        file_put_contents('.tmp/' . $year . '.cache', $cleaned_data);
    }
}

foreach ($years as $year) {
    $file_contents = '<html><body>' . file_get_contents('.tmp/' . $year . '.cache') . '</body></html>';
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
