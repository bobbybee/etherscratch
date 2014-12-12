# bridge creates a virtual network bridge between the Scratch extension in the browser
# and the physical network using a WebSocket server and backpiped hexinject
# it is hyper implementation specific... use with caution

#mkfifo backpipe
#node webcat.js -lwqb < backpipe | sudo hexinject -p -i en0 &
#sudo hexinject -s -i en0 > backpipe

mkfifo backpipe
node webcat.js -lwqb < backpipe &
sudo hexinject -s -i en0 -f ip > backpipe