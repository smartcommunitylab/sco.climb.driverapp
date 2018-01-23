package com.github.google.beaconfig;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;

import java.io.BufferedReader;
import java.io.File;
import java.lang.reflect.Array;
import java.math.BigInteger;
import java.net.URI;
import java.util.Arrays;
import java.util.Scanner;

/**
 * Created by giova on 21/09/2017.
 */

public class EddystoneConfigFileManager{

    private String mFilePath = null;
    public EddystoneConfigFileManager() {
    }

    public EddystoneConfigFileManager(String filepath) {
        mFilePath = filepath;
    }

    public void setFilePath(String filepath){
        mFilePath = filepath;
    }

    public BeaconConfiguration getConfig(int targetBeacon){
        try {
            File fil;
            int start_char = mFilePath.lastIndexOf("/file");
            if(start_char >= 0) { //TODO: for some reason the "/file" suffix has to be removed....
                String realPath = mFilePath.substring(start_char + 5, mFilePath.length());
                fil = new File(realPath);
            }else{
                fil = new File(mFilePath);
            }
            Scanner scanner = new Scanner(fil);
            boolean done = false;
            String line;
            String[] parts = null;
            while(!done){
                if(!scanner.hasNextLine()){
                    scanner.close();
                    return null;
                }
                line = scanner.nextLine();
                parts = line.split(";");
                try{
                    if(Integer.parseInt(parts[0]) == targetBeacon){
                        done = true;
                    }
                }catch (Exception e){

                }
            }

            if(parts.length < 3){ //check if at least one slot is defined in the file
                return null;
            }

            //Check slots validity (just check)
            int numberOfSlots = (parts.length-4)/4 + 1;
            boolean validSlot[] = new boolean[numberOfSlots];
            for(int slotNo = 0; slotNo < numberOfSlots; slotNo++ ){
                boolean advInterval_ok = false;
                boolean txPwr_ok = false;
                boolean data_ok = false;
                boolean slotType_ok = false;

                //check adv interval
                if(!parts[slotNo*4 + 4].isEmpty() && Integer.parseInt(parts[slotNo*4 + 4]) > 100){
                    advInterval_ok = true;
                }

                //check tx pwr
                if(!parts[slotNo*4 + 5].isEmpty()){ //TODO: available tx power are provided with some characteristic value, for now just check that something is present
                    txPwr_ok = true;
                }

                //check slot type
                if(!parts[slotNo*4 + 6].isEmpty() && ( parts[slotNo*4 + 6].equals("UID") || parts[slotNo*4 + 6].equals("TLM") || parts[slotNo*4 + 6].equals("URL"))){
                    slotType_ok = true;
                    //check data
                    if(parts[slotNo*4 + 6].equals("UID")){
                        byte[] namespace_instance_id = hexStringToByteArray(parts[slotNo*4 + 7]);//new BigInteger(parts[slotNo*6 + 5], 16).toByteArray();
                        //byte[] instance = hexStringToByteArray(parts[slotNo*4 + 6]);//new BigInteger(parts[slotNo*6 + 6], 16).toByteArray();
                        if(namespace_instance_id.length == 16){// && instance.length != 0){
                            data_ok = true;
                        }
                    }else if(parts[slotNo*4 + 6].equals("TLM")){
                        data_ok = true; //no data is associated with TLM frames, it there is something discard it
                    }else if(parts[slotNo*4 + 6].equals("URL")){
                        if(parts[7].length() != 0) { //TODO: here a better check should be done...
                            data_ok = true;
                        }
                    }
                }
                if(advInterval_ok & txPwr_ok & slotType_ok & data_ok) {
                    validSlot[slotNo] = true;
                }else{
                    validSlot[slotNo] = false;
                }
            }

            //get data from file
            String beaconName = parts[1];
            String unlockPassword;
            String newPassword;

            if(!parts[2].isEmpty() & parts[2].length() == 32){
                unlockPassword = parts[2];
            }else{
                unlockPassword = null;
            }

            if(!parts[3].isEmpty() & parts[3].length() == 32){
                newPassword = parts[3];
            }else{
                newPassword = unlockPassword;
            }

            BeaconConfiguration config = new BeaconConfiguration(beaconName,unlockPassword,newPassword);
            for(int slotNo = 0; slotNo < numberOfSlots; slotNo++ ) {
                if (validSlot[slotNo]) {
                    int beaconAdvInt = Integer.parseInt(parts[slotNo*4 + 4]);
                    int beaconTxPwr = Integer.parseInt(parts[slotNo*4 + 5]);
                    String slotType = parts[slotNo*4 + 4];

                    if (slotType.equals("UID")) {

                        byte[] data = new byte[17];
                        data[0] = Constants.UID_FRAME_TYPE;

                        byte[] namespace_instance_id = hexStringToByteArray(parts[slotNo*4 + 7]);

                        System.arraycopy(namespace_instance_id, 0, data, 1, namespace_instance_id.length);

                        config.addSlot(data, beaconTxPwr, beaconTxPwr, beaconAdvInt);
                    }

                    if (slotType.equals("TLM")) {
                        byte[] data = new byte[1];
                        data[0] = Constants.TLM_FRAME_TYPE;

                        config.addSlot(data, beaconTxPwr, beaconTxPwr, beaconAdvInt);
                    }

                    if (slotType.equals("URL")) { //not implemented
//                    BeaconConfiguration config = new BeaconConfiguration(beaconName);
//                    String url = parts[slotNo*4 + 7];
                    }
                }
            }
            return config;
        }catch (Exception e){
            e = null;
            return null;
        }
    }

    public static byte[] hexStringToByteArray(String s) {
        int len = s.length();
        s = s.toUpperCase();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }
}
