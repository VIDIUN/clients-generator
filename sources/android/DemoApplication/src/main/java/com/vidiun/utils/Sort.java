package com.vidiun.utils;

import java.util.Comparator;

import com.vidiun.client.types.VidiunCategory;
import com.vidiun.client.types.VidiunFlavorAsset;
import com.vidiun.client.types.VidiunMediaEntry;

/**
 * The class performs a sort
 */
public class Sort<T> implements Comparator<T> {

    private String filter = "name";
    private String direction = "compareTo";

    /**
     * Constructor Description of Sort<T>
     *
     * @param filter Specify which field to sort
     * @param direction Specifies the sort direction
     */
    public Sort(String filter, String direction) {
        this.filter = filter;
        this.direction = direction;
    }

    /**
     * Compares its two arguments for order. Returns a negative integer, zero,
     * or a positive integer as the first argument is less than, equal to, or
     * greater than the second.
     *
     * @param paramT1 the first object to be compared.
     * @param paramT2 the second object to be compared.
     *
     * @return a negative integer, zero, or a positive integer as the first
     * argument is less than, equal to, or greater than the second.
     *
     * @throws ClassCastException - if the arguments' types prevent them from
     * being compared by this Comparator.
     */
    @Override
    public int compare(T paramT1, T paramT2) {

        int res = 0;
        if (paramT1 instanceof VidiunMediaEntry && paramT2 instanceof VidiunMediaEntry) {
            if (this.filter.equals("name")) {
                res = ((VidiunMediaEntry) paramT1).name.compareTo(((VidiunMediaEntry) paramT2).name);
            }
            if (this.filter.equals("plays") && this.direction.equals("compareTo")) {
                res = new Integer(((VidiunMediaEntry) paramT1).plays).compareTo(new Integer(((VidiunMediaEntry) paramT2).plays));
            } else {
                res = ((VidiunMediaEntry) paramT2).plays - ((VidiunMediaEntry) paramT1).plays;
            }
            if (this.filter.equals("createdAt")) {
                res = new Integer(((VidiunMediaEntry) paramT1).createdAt).compareTo(new Integer(((VidiunMediaEntry) paramT2).createdAt));
            }
        }
        if (paramT1 instanceof VidiunCategory && paramT2 instanceof VidiunCategory) {
            res = ((VidiunCategory) paramT1).name.compareTo(((VidiunCategory) paramT2).name);
        }
        if (paramT1 instanceof VidiunFlavorAsset && paramT2 instanceof VidiunFlavorAsset) {
            res = ((VidiunFlavorAsset) paramT2).bitrate - ((VidiunFlavorAsset) paramT1).bitrate;
        }
        return res;
    }
}
