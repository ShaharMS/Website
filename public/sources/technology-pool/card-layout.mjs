export function fitCardText(card){
 const hero=card.querySelector('.tech-card-hero'),title=card.querySelector('h3'),p=card.querySelector('p');if(!p||p.contains(document.activeElement))return;
 const small=card.classList.contains('is-small');p.style.fontSize='';p.style.lineHeight='';p.style.maxHeight='';p.style.overflow='';
 const css=getComputedStyle(card),pad=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom),heroGap=parseFloat(getComputedStyle(hero).marginBottom),titleGap=parseFloat(getComputedStyle(title).marginBottom),available=Math.max(30,card.clientHeight-pad-hero.offsetHeight-heroGap-title.offsetHeight-titleGap);
 let line=parseFloat(getComputedStyle(p).lineHeight),font=parseFloat(getComputedStyle(p).fontSize);
 while(p.scrollHeight>available&&line>(small?15:18)){line-=.5;p.style.lineHeight=line+'px';}
 while(p.scrollHeight>available&&font>(small?11:12)){font-=.5;p.style.fontSize=font+'px';}
 if(p.scrollHeight>available){p.style.maxHeight=available+'px';p.style.overflow='auto';}
}
