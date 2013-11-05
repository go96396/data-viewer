Data Viewer
=============

Created because I thought clicking the refresh button was too much effort, this little app fetches data you produce from other means periodically and displays it nicely for your viewing pleasure.

Add it to a directory above where ever you generate your data files and fire up a server in it's root. I find
````
python -m SimpleHTTPServer
````
does the trick (provided you have Python installed of course).

Configure the app from the settings pane being careful to input the data source URL as relative to the directory the app is being server from. It will default to a sample file, a refresh period of 60s (the minimum allowed is 0.2s) and raw data format.

Hit go and it will make periodic AJAX requests for the data file you specify. Currently it supports the formatting into tables of CSV and TSV files. It will also plot a scatter graph of CSV or TSV data, but this feature is very new and might break.

To reload the data source just once, click the 'Load data once' button or use 'l' as a keyboard shortcut.

**Note:** in scatter graph mode, the app assumes your first column contains the x coordinates which are mapped to each successive column intepretted as successive y coordinate series.

## Possible Features to Add:

If you have any ideas for a feature this app could benefit from [tweet me](https://twitter.com/jeshuamaxey).

* a history feature in the data url selection process
* syntax highlighting for json
* option to refresh on click instead of periodically [DONE]
* status indicator (running or not running)


## Known Bugs:

* ~~typing the letter 'l' when entering the data URL causes the app to reload the data~

## Sample Data
Sample data sets can be found in the `sample-data` directory. It includes:

* `linegraph.csv`
* `outbound.csv`
* `outbound.json`
* `sample.csv`
* `sample.tsv`
