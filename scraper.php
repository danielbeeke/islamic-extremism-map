<?php

include('simple_html_dom.php');

$years = [2011, 2012, 2013, 2014, 2015, 2016];

foreach ($years as $year) {
    if (!file_exists('.tmp/' . $year . '.cache')) {
        $year_data = file_get_contents('http://www.thereligionofpeace.com/attacks/attacks.aspx?Yr=' . $year);
        file_put_contents('.tmp/' . $year . '.cache', $year_data);
    }
}

foreach ($years as $year) {
    $html = file_get_html('.tmp/' . $year . '.cache');

    foreach($html->find('div.post div.centre h3') as $e) {
        foreach($e->find("a") as $a) $text = $a->innertext;
        foreach($e->find("a") as $a) $link = $a->href;
    }
}
