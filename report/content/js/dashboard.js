/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 54.2, "KoPercent": 45.8};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.354, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [0.445, 500, 1500, " Simple Travel Agency!"], "isController": false}, {"data": [0.01, 500, 1500, "CSVBooking"], "isController": false}, {"data": [0.67, 500, 1500, "Simulate Flight Search"], "isController": false}, {"data": [0.0, 500, 1500, "Booking"], "isController": false}, {"data": [0.645, 500, 1500, "Confirmation"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 500, 229, 45.8, 921.7940000000007, 0, 24248, 512.0, 1034.6000000000001, 1507.1999999999998, 14404.630000000001, 5.54385186827808, 27.696120256541747, 1.2223327142698748], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": [" Simple Travel Agency!", 100, 10, 10.0, 1354.49, 504, 24248, 690.5, 1499.0000000000005, 2805.349999999996, 24148.20999999995, 3.2250782081465474, 14.695837331086528, 0.3779388525171735], "isController": false}, {"data": ["CSVBooking", 100, 98, 98.0, 18.740000000000002, 0, 992, 0.0, 0.0, 0.0, 990.8999999999994, 3.324468085106383, 4.642372942985372, 0.01908971908244681], "isController": false}, {"data": ["Simulate Flight Search", 100, 2, 2.0, 912.22, 325, 19064, 531.5, 1055.1000000000001, 1644.9999999999977, 18992.319999999963, 3.2214419174022293, 22.349822921364602, 0.7833389037433155], "isController": false}, {"data": ["Booking", 100, 100, 100.0, 1220.55, 393, 15806, 514.5, 877.0000000000009, 11325.99999999988, 15791.999999999993, 3.2278889606197545, 20.974753116930277, 1.610792244996772], "isController": false}, {"data": ["Confirmation", 100, 19, 19.0, 1102.9699999999996, 322, 15484, 507.0, 1150.0, 1761.7999999999968, 15460.729999999989, 3.244751614263928, 18.138668516175088, 0.769994767838022], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 1,292 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,008 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,109 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["429/Too Many Requests", 6, 2.6200873362445414, 1.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,776 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,013 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 24,248 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 881 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 2,470 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 10,934 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 15,484 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 14,269 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 2,826 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,150 milliseconds, but should not have lasted longer than 800 milliseconds.", 2, 0.8733624454148472, 0.4], "isController": false}, {"data": ["The operation lasted too long: It took 1,357 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 2,823 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 11,573 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,049 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,024 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,146 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,381 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 1,492 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 13,157 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 12,833 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The operation lasted too long: It took 2,466 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in query at index 49: https://www.blazedemo.com/purchase.php?inputName=&lt;EOF&gt;&amp;address=&lt;EOF&gt;&amp;city=&lt;EOF&gt;&amp;state=&lt;EOF&gt;&amp;zipCode=&lt;EOF&gt;&amp;creditCardNumber=&lt;EOF&gt;&amp;creditCardMonth=&lt;EOF&gt;&amp;creditCardYear=&lt;EOF&gt;&amp;cardType=&lt;EOF&gt;", 98, 42.79475982532751, 19.6], "isController": false}, {"data": ["The operation lasted too long: It took 2,436 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, 0.4366812227074236, 0.2], "isController": false}, {"data": ["The result was the wrong size: It was 6,719 bytes, but should have been greater or equal to 8,000 bytes.", 99, 43.23144104803494, 19.8], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 500, 229, "The result was the wrong size: It was 6,719 bytes, but should have been greater or equal to 8,000 bytes.", 99, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in query at index 49: https://www.blazedemo.com/purchase.php?inputName=&lt;EOF&gt;&amp;address=&lt;EOF&gt;&amp;city=&lt;EOF&gt;&amp;state=&lt;EOF&gt;&amp;zipCode=&lt;EOF&gt;&amp;creditCardNumber=&lt;EOF&gt;&amp;creditCardMonth=&lt;EOF&gt;&amp;creditCardYear=&lt;EOF&gt;&amp;cardType=&lt;EOF&gt;", 98, "429/Too Many Requests", 6, "The operation lasted too long: It took 1,150 milliseconds, but should not have lasted longer than 800 milliseconds.", 2, "The operation lasted too long: It took 1,292 milliseconds, but should not have lasted longer than 800 milliseconds.", 1], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [" Simple Travel Agency!", 100, 10, "429/Too Many Requests", 2, "The operation lasted too long: It took 12,833 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 24,248 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 2,823 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1, "The operation lasted too long: It took 2,466 milliseconds, but should not have lasted longer than 2,000 milliseconds.", 1], "isController": false}, {"data": ["CSVBooking", 100, 98, "Non HTTP response code: java.net.URISyntaxException/Non HTTP response message: Illegal character in query at index 49: https://www.blazedemo.com/purchase.php?inputName=&lt;EOF&gt;&amp;address=&lt;EOF&gt;&amp;city=&lt;EOF&gt;&amp;state=&lt;EOF&gt;&amp;zipCode=&lt;EOF&gt;&amp;creditCardNumber=&lt;EOF&gt;&amp;creditCardMonth=&lt;EOF&gt;&amp;creditCardYear=&lt;EOF&gt;&amp;cardType=&lt;EOF&gt;", 98, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Simulate Flight Search", 100, 2, "429/Too Many Requests", 2, "", "", "", "", "", "", "", ""], "isController": false}, {"data": ["Booking", 100, 100, "The result was the wrong size: It was 6,719 bytes, but should have been greater or equal to 8,000 bytes.", 99, "429/Too Many Requests", 1, "", "", "", "", "", ""], "isController": false}, {"data": ["Confirmation", 100, 19, "The operation lasted too long: It took 1,150 milliseconds, but should not have lasted longer than 800 milliseconds.", 2, "The operation lasted too long: It took 1,292 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, "The operation lasted too long: It took 1,008 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, "The operation lasted too long: It took 1,109 milliseconds, but should not have lasted longer than 800 milliseconds.", 1, "The operation lasted too long: It took 11,573 milliseconds, but should not have lasted longer than 800 milliseconds.", 1], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
