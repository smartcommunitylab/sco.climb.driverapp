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

            if(parts.length < 8){ //check if at least one slot is defined in the file
                return null;
            }

            //Check slots validity
            int numberOfSlots = (parts.length-2)/6;
            boolean validSlot[] = new boolean[numberOfSlots];
            for(int slotNo = 0; slotNo < numberOfSlots; slotNo++ ){
                boolean advInterval_ok = false;
                if(!parts[slotNo*6 + 2].isEmpty() && Integer.parseInt(parts[slotNo*6 + 2]) > 100){
                    advInterval_ok = true;
                }
                boolean slotType_ok = false;
                boolean slot_ok = false;
                if(!parts[slotNo*6 + 4].isEmpty() && parts[slotNo*6 + 4].equals("UID") || parts[slotNo*6 + 4].equals("TLM") || parts[slotNo*6 + 4].equals("URL")){
                    slotType_ok = true;
                    if(parts[slotNo*6 + 4].equals("UID")){
                        byte[] namespace = hexStringToByteArray(parts[slotNo*6 + 5]);//new BigInteger(parts[slotNo*6 + 5], 16).toByteArray();
                        byte[] instance = hexStringToByteArray(parts[slotNo*6 + 6]);//new BigInteger(parts[slotNo*6 + 6], 16).toByteArray();
                        if(namespace.length != 0 && instance.length != 0){
                            slot_ok = true;
                        }
                    }else if(parts[slotNo*6 + 4].equals("TLM")){
                        slot_ok = true;
                    }else if(parts[slotNo*6 + 4].equals("URL")){
                        if(parts[7].length() != 0) {
                            slot_ok = true;
                        }
                    }
                }
                if(advInterval_ok & slotType_ok & slot_ok) {
                    validSlot[slotNo] = true;
                }else{
                    validSlot[slotNo] = false;
                }
            }

            String beaconName = parts[1];
            BeaconConfiguration config = new BeaconConfiguration(beaconName);
            for(int slotNo = 0; slotNo < numberOfSlots; slotNo++ ) {
                if (validSlot[slotNo]) {
                    int beaconAdvInt = Integer.parseInt(parts[slotNo*6 + 2]);
                    int beaconTxPwr = Integer.parseInt(parts[slotNo*6 + 3]);
                    String slotType = parts[slotNo*6 + 4];

                    if (slotType.equals("UID")) {

                        byte[] data = new byte[17];
                        data[0] = Constants.UID_FRAME_TYPE;

                        byte[] namespace = hexStringToByteArray(parts[slotNo*6 + 5]);//new BigInteger(parts[slotNo*6 + 5], 16).toByteArray();
                        byte[] instance = hexStringToByteArray(parts[slotNo*6 + 6]);//new BigInteger(parts[slotNo*6 + 6], 16).toByteArray();

                        //truncate or zero padding
                        namespace = Arrays.copyOf(namespace,10);
                        instance = Arrays.copyOf(instance,6);

                        System.arraycopy(namespace, 0, data, 1, namespace.length);
                        System.arraycopy(instance, 0, data, 11, instance.length);

                        config.addSlot(data, beaconTxPwr, beaconTxPwr, beaconAdvInt);
                    }

                    if (slotType.equals("TLM")) {
                        byte[] data = new byte[1];
                        data[0] = Constants.TLM_FRAME_TYPE;

                        config.addSlot(data, beaconTxPwr, beaconTxPwr, beaconAdvInt);
                    }

                    if (slotType.equals("URL")) { //not implemented
//                    BeaconConfiguration config = new BeaconConfiguration(beaconName);
//                    String url = parts[7];
//                    return config;
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
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                    + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }
}
