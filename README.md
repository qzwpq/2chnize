# 2chnize

BBS-style twitter client

## Dependencies

* npm
* electron

## How to run

```shell
git clone https://github.com/qzwpq/2chnize.git ~/2chnize
cd ~/2chnize
npm install
echo '[]' | tee ng-list/{client,text,screen_name}.json replace-rule/text.json > /dev/null
cp sample/config.json.sample config.json
cp sample/keys.json.sample keys.json
cp sample/timelines.sample.json timelines.json
vim keys.json # write your keys
electron .
```

## sample of ng-list and replace-rule

see sample directory

## TODO

* multi-column
* key-binding
* word-search
* reply
* favorite
* retweet
* list

## License

MIT
