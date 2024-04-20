import { useState,useEffect } from "react"

export const useOrigin = ()=>{
    const [isMounted,SerMounted] =  useState(false);

    useEffect(()=>{
        SerMounted(true)
    },[])
    if(!isMounted){
        return ""
    }

    const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    return origin;
}