import getopt
import os
import sys
import traceback

from qiniu import Auth, put_file

bucket_name = 'testeabc'
script_abs_path = os.path.dirname(os.path.realpath(__file__))
input_target_dir_path = ''

def updir(dirpath, ak, sk, prefix, n_indent):
    indent_spaces = ''
    if 0 == n_indent:
        indent_spaces = '|'
    else: 
        for x in range(0, n_indent):
            indent_spaces += ' '
    # print(indent_spaces + 'updir: ' + 'dirpath = ' + dirpath)
    if os.path.isdir(dirpath):
        sublist = os.listdir(dirpath)
        for sub in sublist:
            updir(os.path.join(os.path.normpath(dirpath), sub), ak, sk, prefix, n_indent + 1)
    else:
        q = Auth(ak, sk)
        token = q.upload_token(bucket_name)
        fpath, fname = os.path.split(dirpath)
        patharr = fpath.split(os.sep)
        try:
            key = getKey(dirpath, prefix)
            print(key)
            ret, info = put_file(token, key, dirpath)
            print(ret)
        except:
            traceback.print_exc()


def getKey(filepath, prefix):
    critical_basename = os.path.basename(os.path.normpath(input_target_dir_path)) 
    critical_filepath = filepath[len(os.path.normpath(input_target_dir_path)):]
    critical_filepath = critical_filepath.replace('\\', '/')

    print('critical_basename = `' + critical_basename + '`, critical_filepath = `' + critical_filepath + '`')
    key = '/' + critical_basename + critical_filepath
    if prefix:
        key = prefix + key
    return key

if __name__ == '__main__':
    upload_dir = ''
    ak = ''
    sk = ''
    prefix = ''
    print('os.sep = ' + os.sep)
    try:
        opts, args = getopt.getopt(sys.argv[1:], "hd:a:s:", ["dir=", "ak=", "sk=", "prefix="])
    except getopt.GetoptError:
        print('python upload_to_qiniu.py -d <dir> -a <ak> -s <sk> [--prefix=]')
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print('python upload_to_qiniu.py -d <dir> -a <ak> -s <sk>  [--prefix=]')
            sys.exit()
        elif opt in ("-d", "--dir"):
            input_target_dir_path = arg
            upload_dir = arg
        elif opt in ("-a", "--ak"):
            ak = arg
        elif opt in ("-s", "--sk"):
            sk = arg
        elif opt == "--prefix":
            prefix = arg.replace('\\', '')
            prefix = prefix.replace('\/', '')
            prefix = os.path.basename(prefix)
    
    updir(upload_dir, ak, sk, prefix, 0)
