mkdir paperData/$1

echo "cp $1.pdf ./paperData/$1/paper.pdf"
cp $1.pdf ./paperData/$1/paper.pdf

curl -v --form input=@./$1.pdf --form teiCoordinates=persName --form teiCoordinates=figure --form teiCoordinates=ref --form teiCoordinates=biblStruct --form teiCoordinates=formula http://cloud.science-miner.com/grobid/api/processFulltextDocument > paperData/$1/metaData.tei

curl -v --form input=@./$1.pdf --form teiCoordinates=persName --form teiCoordinates=figure --form teiCoordinates=ref --form teiCoordinates=biblStruct --form teiCoordinates=formula http://cloud.science-miner.com/grobid/api/referenceAnnotations > paperData/$1/metaData.json
 
cd pdffigures2

sbt "run-main org.allenai.pdffigures2.FigureExtractorBatchCli ../paperData/$1/paper.pdf -s stat_file.json -m imageOutput -d dataOutput"

mv imageOutput* ../paperData/$1/
mv dataOutput* ../paperData/$1/

cd ..

