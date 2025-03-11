import { fat, scary, nasty, ugly, awful, dirty, dumb, tall, short, hairy, bald, old, poor, skinny, clumsy, evil, greedy, lazy, loud, entitled, other } from "./jokes/other"


export const categorizer = (arr) => {
    const newfat = arr.filter(joke => joke.toLowerCase().includes(" fat") || joke.toLowerCase().includes(" big"))
    const newugly = arr.filter(joke => joke.toLowerCase().includes(" ugly"))
    const newsmall = arr.filter(joke => joke.toLowerCase().includes(" small") || joke.toLowerCase().includes(" short"))
    const newtall = arr.filter(joke => joke.toLowerCase().includes(" tall"))
    const newdumb = arr.filter(joke => joke.toLowerCase().includes(" dumb") || joke.toLowerCase().includes(" stupid"))
    const newhairy = arr.filter(joke => joke.toLowerCase().includes(" hairy"))
    const newold = arr.filter(joke => joke.toLowerCase().includes(" old"))
    const newpoor = arr.filter(joke => joke.toLowerCase().includes(" poor"))
    const newbald = arr.filter(joke => joke.toLowerCase().includes(" bald"))
    const newdirty = arr.filter(joke => joke.toLowerCase().includes(" dirty") || joke.toLowerCase().includes(" gross") || joke.toLowerCase().includes(" stinks") || joke.toLowerCase().includes(" stank") || joke.toLowerCase().includes(" so yellow") || joke.toLowerCase().includes(" smelly"))
    const newnasty = arr.filter(joke => joke.toLowerCase().includes(" nasty"))
    const newskinny = arr.filter(joke => joke.toLowerCase().includes(" skinny"))
    const newlazy = arr.filter(joke => joke.toLowerCase().includes(" lazy"))
    const newother = arr.filter(joke => !joke.toLowerCase().includes(" smelly") && !joke.toLowerCase().includes(" so yellow") && !joke.toLowerCase().includes(" stank") && !joke.toLowerCase().includes(" stinks") && !joke.toLowerCase().includes(" gross") && !joke.toLowerCase().includes(" lazy") && !joke.toLowerCase().includes(" skinny") && !joke.toLowerCase().includes(" big") && !joke.toLowerCase().includes("so black") && !joke.toLowerCase().includes(" nasty") && !joke.toLowerCase().includes(" dirty") && !joke.toLowerCase().includes(" bald") && !joke.toLowerCase().includes(" fat") && !joke.toLowerCase().includes(" short") && !joke.toLowerCase().includes(" poor") && !joke.toLowerCase().includes(" ugly") && !joke.toLowerCase().includes(" small") && !joke.toLowerCase().includes(" tall") && !joke.toLowerCase().includes(" dumb") && !joke.toLowerCase().includes(" stupid") && !joke.toLowerCase().includes(" hairy") && !joke.toLowerCase().includes(" old"))

    console.log("fat: ", [...new Set([...fat, ...newfat])])
    console.log("ugly: ", [...new Set([...ugly, ...newugly])])
    console.log("small: ", [...new Set([...short, ...newsmall])])
    console.log("tall: ", [...new Set([...tall, ...newtall])])
    console.log("dumb: ", [...new Set([...dumb, ...newdumb])])
    console.log("hairy: ", [...new Set([...hairy, ...newhairy])])
    console.log("old: ", [...new Set([...old, ...newold])])
    console.log("poor: ", [...new Set([...poor, ...newpoor])])
    console.log("bald: ", [...new Set([...bald, ...newbald])])
    console.log("dirty: ", [...new Set([...dirty, ...newdirty])])
    console.log("nasty: ", [...new Set([...nasty, ...newnasty])])
    console.log("skinny: ", [...new Set([...skinny, ...newskinny])])
    console.log("lazy: ", [...new Set([...lazy, ...newlazy])])
    console.log("other: ", [...new Set([...other, ...newother])])
}