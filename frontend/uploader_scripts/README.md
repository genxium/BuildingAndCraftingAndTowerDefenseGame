dependency:
```pip install qiniu```


upload dir to qiniu
```bash
python upload_to_qiniu.py -d <dir> -a <ak> -s <sk> [--prefix=]
```
prefix: key前缀

For example
```
shell> python upload_to_qiniu.py -d ../build/wechatgame/res/ --prefix="wechat-game" -a <MyAppKey> -s <MySecretKey>
```
