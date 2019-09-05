for filename in global
do
    sh getMetadata.sh $filename

    rm -rf ./paperData/paper
    ln -s  ./paperData/$filename ./paperData/paper
done
