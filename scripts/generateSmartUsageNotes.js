import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/vocabulary-2000.json');

// 51 Overridden Words Map (Confusion/Tricky Words)
const confusionMap = {
  actor: {
    warning: "ระวังการเลือกใช้คำระบุเพศ แม้ในอดีตมักใช้ actor คู่กับ actress (นักแสดงหญิง) แต่ปัจจุบัน actor นิยมใช้เป็นคำกลางครอบคลุมทั้งชายและหญิง",
    tip: "สังเกตว่าการใช้ actor เป็นคำกลางจะช่วยเลี่ยงความตระหนักเรื่องเพศ และออกเสียงลงท้าย /tər/ เบาๆ ไม่ลากเสียงยาวแบบ 'แอค-เตอร์'"
  },
  adult: {
    warning: "หลีกเลี่ยงการใช้ adult ในบริบททั่วไปหากสื่อถึงความหมาย 'ผู้ใหญ่' ที่เน้นพฤติกรรมทางเพศ (adult content) เพราะอาจทำให้เข้าใจผิดในแง่สื่อลามกได้",
    tip: "แนะนำให้ออกเสียงเน้นหนัก (stress) ที่พยางค์แรก คือ /ˈædʌlt/ หรือสามารถออกเสียงเน้นพยางค์หลัง /əˈdʌlt/ ในสำเนียงอังกฤษได้เช่นกัน"
  },
  afraid: {
    warning: "จำไว้ว่า afraid เป็นคุณศัพท์ประเภทวางหลังคำกริยาเชื่อมโยง (linking verb เช่น be, feel) เท่านั้น ห้ามนำไปวางหน้าคำนามเด็ดขาด เช่น ห้ามพูดว่า an afraid boy",
    tip: "จำโครงสร้าง 'be afraid of + นาม/V-ing' เช่น be afraid of heights (กลัวความสูง) หรือ be afraid of losing (กลัวการพ่ายแพ้)"
  },
  afternoon: {
    warning: "ในการใช้คำบอกเวลาคู่กับ afternoon ต้องใช้คู่กับวลี 'in the afternoon' เสมอ ห้ามใช้ 'at afternoon' ซึ่งต่างจากคำว่า noon ที่ใช้ 'at noon'",
    tip: "สังเกตตำแหน่งเน้นเสียง (stress) ของ afternoon ซึ่งอยู่ที่พยางค์สุดท้าย /ˌæftərˈnuːn/ เสมอเพื่อให้สำเนียงถูกต้องลื่นไหล"
  },
  airport: {
    warning: "ระวังการใช้บอกตำแหน่งเมื่อกล่าวถึงสนามบิน มักใช้ 'at the airport' เมื่อระบุจุดพิกัดเดินทางหรือจุดนัดพบ ต่างจาก 'in the airport' ที่หมายถึงอยู่ภายในตัวอาคาร",
    tip: "เสียงตัวสะกดท้ายคือ /rt/ ต้องออกเสียงพยัญชนะสะกด /r/ และ /t/ ต่อเนื่องกันเบาๆ เพื่อให้การพูดคำนี้สมบูรณ์แบบ"
  },
  alarm: {
    warning: "หลีกเลี่ยงความสับสนระหว่างการใช้ alarm ในฐานะเสียงสัญญาณเตือนภัยทั่วไปกับการระบุถึงตัวอุปกรณ์นาฬิกาปลุก ซึ่งนิยมเรียกว่า alarm clock เจาะจงกว่า",
    tip: "ออกเสียงตัวสะกดท้ายด้วยเสียง /m/ โดยต้องปิดปากให้สนิทตอนท้ายคำเพื่อสร้างเสียงสะกดมอม้า และเน้นเสียงหนักที่พยางค์หลัง /əˈlɑːrm/"
  },
  angle: {
    warning: "ระวังการสะกดคำสับสนระหว่าง angle (มุม) กับ angel (นางฟ้า) ซึ่งมีความหมายแตกต่างกันอย่างสิ้นเชิงและมักพิมพ์สลับกันบ่อย",
    tip: "คำว่า angle สะกดด้วย -le ท้ายคำและออกเสียงสะกด /ɡl/ ส่วน angel สะกดด้วย -el ท้ายคำและออกเสียงสะกด /dʒl/ ต่างกันชัดเจน"
  },
  angry: {
    warning: "ระวังสะกดหรือออกเสียงสลับกับคำว่า hungry (หิว) และเวลาใช้ angry แนะนำให้จำคู่บุพบท 'angry with + บุคคล' หรือ 'angry about + เรื่องราว'",
    tip: "ในการออกเสียงคำว่า angry จะขึ้นต้นด้วยสระแอ /ˈæŋ.ɡri/ ต่างจาก hungry ที่ขึ้นต้นด้วยเสียงหอนกฮูกสระอะ /ˈhʌŋ.ɡri/"
  },
  ant: {
    warning: "ระวังการออกเสียงทับซ้อนและสับสนกับคำว่า aunt (ป้า/น้า/อา) ซึ่งมีวิธีการออกเสียงที่แตกต่างกันในบางสำเนียง เช่น สำเนียงอังกฤษ (UK)",
    tip: "ในสำเนียงอเมริกัน ant และ aunt อาจออกเสียงเหมือนกันคือ /ænt/ แต่ในสำเนียงอังกฤษ aunt จะออกเสียงสระอา /ɑːnt/ ขณะที่ ant จะเป็นสระแอ /ænt/"
  },
  app: {
    warning: "หลีกเลี่ยงการสับสนระหว่าง app (แอปพลิเคชันมือถือ/โปรแกรมคอมพิวเตอร์) กับ apple (แอปเปิ้ล) ทั้งในแง่ความหมายและการสะกดคำพื้นฐาน",
    tip: "คำว่า app เป็นคำย่อแบบไม่เป็นทางการของ application มีเสียงสะกดท้ายสั้นด้วยตัว /p/ (พ) ขณะที่ apple มีเสียงท้ายยาวกว่า"
  },
  apple: {
    warning: "ระวังข้อผิดพลาดในการสะกดคำว่า apple โดยต้องใช้พยัญชนะ p ซ้อนกันสองตัว (double p) เสมอ และหลีกเลี่ยงการสะกดด้วย p ตัวเดียว",
    tip: "ออกเสียงท้ายคำด้วยสัทอักษร /l/ สั้นๆ โดยใช้ปลายลิ้นแตะที่ปุ่มเหงือกด้านบนเบาๆ เพื่อไม่ให้เสียงเพี้ยนเป็นสระอู"
  },
  april: {
    warning: "ระวังจุดออกเสียงผิดของคำว่า april โดยสระตัวแรกต้องออกเสียงเป็นสระเอ /eɪ/ ไม่ใช่สระอาหรือแอเหมือนที่คนไทยบางคนคุ้นเคย",
    tip: "การสะกดชื่อเดือน April ต้องเริ่มต้นด้วยอักษรตัวใหญ่ (Capital letter) เสมอ และออกเสียงเน้นหนักที่พยางค์แรก /ˈeɪ.prəl/"
  },
  artist: {
    warning: "อย่าจำสับสนระหว่าง artist (ศิลปิน/จิตรกร) กับ actor (นักแสดง) แม้ทั้งคู่จะเกี่ยวข้องกับแวดวงศิลปะบันเทิงแต่ทำหน้าที่ต่างกัน",
    tip: "คำลงท้ายด้วย -ist แสดงถึงผู้เชี่ยวชาญในสาขาเฉพาะทาง สำหรับคำนี้ให้ออกเสียงตัวสะกดท้ายเสียง /st/ ควบคู่ไปด้วยเสมอ"
  },
  assistant: {
    warning: "ระวังการสะกดผิดพลาดในคำว่า assistant ซึ่งต้องใช้ตัวอักษร s สองตัวสะกดคู่กัน (double s) และลงท้ายด้วยสระ -ant ไม่ใช่ -ent",
    tip: "คำนี้มีรากศัพท์มาจากกริยา assist แปลว่าช่วยเหลือ สังเกตตัวสะกดท้ายมีเสียงสะกดควบกล้ำ /nt/ (น-ท) เบาๆ ท้ายคำ"
  },
  august: {
    warning: "ระวังการสับสนเรื่องการเน้นเสียงหนัก (stress) ในคำว่า august ซึ่งเมื่อหมายถึงเดือนสิงหาคมจะเน้นหนักพยางค์แรก คือ /ˈɔː.ɡəst/",
    tip: "เช่นเดียวกับเดือนอื่นๆ คำว่า August ต้องสะกดด้วยอักษรตัวใหญ่ขึ้นต้น และเน้นเสียงตัวสะกด /st/ ท้ายพยางค์อย่างเหมาะสม"
  },
  aunt: {
    warning: "ระวังจุดสะกดผิดหรือสับสนในความหมายกับคำว่า ant (มด) รวมถึงการออกเสียงที่ต้องแยกความแตกต่างให้ชัดเจนตามแต่ละสำเนียง",
    tip: "คนไทยควรฝึกออกเสียงสระอาในสำเนียงอังกฤษ /ɑːnt/ หรือสระแอยาวในสำเนียงอเมริกัน /ænt/ และอย่าลืมเสียงสะกดตัวท้าย /t/"
  },
  autumn: {
    warning: "ระวังเรื่องพยัญชนะเงียบในคำสะกด โดยอักษร n ที่อยู่ท้ายสุดของคำว่า autumn จะไม่มีการออกเสียงสะกด (silent n) ห้ามออกเสียงสะกดนหนู",
    tip: "ในทางภูมิศาสตร์และการสื่อสาร คำว่า autumn นิยมใช้ในฝั่งอังกฤษ (UK) ขณะที่ฝั่งอเมริกา (US) จะนิยมใช้คำว่า fall แทน"
  },
  baby: {
    warning: "ระวังการเปลี่ยนรูปพหูพจน์ของ baby โดยต้องเปลี่ยนอักษร y เป็น i แล้วเติม es เสมอ เป็น babies และหลีกเลี่ยงการเติม s ท้าย y โดยตรง",
    tip: "คำศัพท์นี้มักถูกนำไปใช้เป็นภาษาแสลงในความหมายเรียกร้องความสนใจหรือแทนตัวแฟนหนุ่ม/แฟนสาวในสถานการณ์ไม่เป็นทางการ"
  },
  back: {
    warning: "ระวังการเปลี่ยนหน้าที่ทางไวยากรณ์ (POS shifts) ของ back ซึ่งสามารถทำได้หลายแบบทั้งนาม วิเศษณ์ คุณศัพท์ หรือคำกริยา ขึ้นกับบริบทประโยค",
    tip: "การออกเสียงสะกดตัวท้ายลงท้ายด้วยเสียง /k/ (ค) ต้องพ่นลมออกทางปากสั้นๆ เพื่อให้เสียงสะกดคำนี้ชัดเจนและไม่เพี้ยนเป็นคำอื่น"
  },
  backpack: {
    warning: "ระวังการสับสนความหมายกับกระเป๋าทั่วไป (bag) โดย backpack จะหมายถึงกระเป๋าเป้สะพายหลังที่มีสายสะพายสองข้างโดยเฉพาะ",
    tip: "คำนี้เป็นการประสมคำระหว่าง back (หลัง) และ pack (หีบห่อ) ออกเสียงสะกดควบทั้งสองพยางค์ด้วยลมสะกดตัวสะกด /k/ ท้ายพยางค์"
  },
  bad: {
    warning: "ระวังการสะกดและการออกเสียงสับสนสลับกันระหว่าง bad (เลว/ไม่ดี) กับ bed (เตียงนอน) ซึ่งมีสระเสียงสั้นใกล้เคียงกันมาก",
    tip: "คำว่า bad ออกเสียงด้วยสระแอยาวเสียงต่ำ /bæd/ ขณะที่ bed ออกเสียงสระเอะเสียงสั้น /bed/ ลองฝึกออกเสียงสระให้กว้างต่างกัน"
  },
  bag: {
    warning: "ระวังเรื่องการออกเสียงสะกดตัวท้าย /ɡ/ (ก) ซึ่งต้องมีเสียงก้องในลำคอเบาๆ ห้ามออกเสียงสะกดเป็นเสียงตัวเค /k/ หรือพ่นลมสะกดแรงแบบ bag-k",
    tip: "คนไทยมักออกเสียงสะกดตัวสะกดกริยาหรือคำนามท้ายคำด้วยตัวสะกดเบาเกินไป ลองลากเสียงตัวสะกดท้ายให้มีแรงดันลมก้องเล็กน้อย"
  },
  banana: {
    warning: "ระวังเรื่องความแตกต่างของการเน้นเสียงหนัก (stress) และสระใน banana ระหว่างสำเนียงอังกฤษและอเมริกันซึ่งค่อนข้างชัดเจน",
    tip: "สำเนียงอเมริกันมักออกเสียงสระแอในพยางค์ที่สอง /bəˈnæn.ə/ ส่วนสำเนียงอังกฤษมักจะออกเป็นสระอายาว /bəˈnɑː.nə/ เน้นพยางค์กลางเหมือนกัน"
  },
  bear: {
    warning: "ระวังความสับสนระหว่างคำพ้องเสียงและคำสะกดคล้าย เช่น bear (หมี/อดทน) กับ beer (เบียร์) ซึ่งออกเสียงต่างกันอย่างสิ้นเชิง",
    tip: "คำว่า bear ออกเสียงด้วยสระแอร์ /beər/ (หรือ /ber/ ในสำเนียง US) ในขณะที่ beer จะออกเสียงด้วยสระเอีย /bɪər/ อย่าลอกเลียนแบบเสียงสลับกัน"
  },
  coffee: {
    warning: "ระวังอย่าสับสนระหว่างคำว่า coffee (น้ำกาแฟ) กับ cafe (ร้านกาแฟ/ร้านอาหารขนาดเล็ก) ซึ่งเป็นคนละประเภทคำและความหมาย",
    tip: "ในการสะกดคำว่า coffee ต้องเขียนพยัญชนะ f สองตัว และ e สองตัวสะกดคู่ท้ายเสมอ (double f, double e) คือ c-o-f-f-e-e"
  },
  diary: {
    warning: "ระวังจุดสะกดผิดระดับคลาสสิกสับสนระหว่าง diary (สมุดบันทึกประจำวัน) กับ dairy (ผลิตภัณฑ์ที่ทำจากนม) ซึ่งเขียนสลับตัวอักษรกันบ่อยมาก",
    tip: "เทคนิคจำคือ d-i-a-r-y ขึ้นด้วย di- สื่อถึงวัน (day) ใช้บันทึกรายวัน ส่วน d-a-i-r-y ขึ้นด้วย da- เกี่ยวข้องกับฟาร์มนม"
  },
  glass: {
    warning: "ระวังการสับสนเสียงสะกดและการแปลความหมายระหว่าง glass (แก้วน้ำ/กระจก) กับ grass (หญ้า) เนื่องจากเสียงควบกล้ำ L และ R ต่างกัน",
    tip: "เมื่อสะกดแก้วน้ำ glass ต้องใช้ควบกล้ำ /ɡl/ และออกเสียงลิ้นแตะปุ่มเหงือกด้านบน ส่วน grass ใช้ควบกล้ำ /ɡr/ และต้องห่อลิ้นสั่นระรัว"
  },
  kitchen: {
    warning: "ระวังการพิมพ์หรือจำสับสนสลับความหมายกับคำสะกดคล้ายอย่าง chicken (ไก่) ซึ่งเป็นข้อผิดพลาดที่พบได้บ่อยมากในผู้เรียนเริ่มต้น",
    tip: "คำว่า kitchen (ห้องครัว) เริ่มต้นด้วยพยัญชนะ k-i /ˈkɪtʃ.ən/ ขณะที่ chicken (ไก่) เริ่มต้นด้วยพยัญชนะ c-h-i /ˈtʃɪk.ɪn/"
  },
  soup: {
    warning: "ระวังจำคำสับสนหรือสะกดสลับกันระหว่าง soup (น้ำแกง/ซุป) กับ soap (สบู่) ซึ่งออกเสียงสระต่างกันและใช้อุปโภคบริโภคคนละแบบ",
    tip: "คำว่า soup สะกดสระด้วย -ou- และออกเสียงด้วยสระอูยาว /suːp/ ขณะที่ soap สะกดด้วย -oa- และออกเสียงด้วยสระโอ /soʊp/"
  },
  work: {
    warning: "ระวังการออกเสียงทับซ้อนและสับสนระหว่าง work (ทำงาน) กับ walk (เดิน) ซึ่งเป็นคำศัพท์พื้นฐานที่มีเสียงสระต่างกันชัดเจน",
    tip: "คำว่า work ออกเสียงสะกดเป็นสระเออ /wɜːrk/ (มีเสียง R ก้องในลำคอ) ส่วน walk ออกเสียงสะกดด้วยสระออยาว /wɔːk/ โดยไม่มีการออกเสียงตัว L"
  },
  borrow: {
    warning: "ระวังอย่าใช้สลับบริบทระหว่าง borrow (ขอยืม - รับมา) กับ lend (ให้ยืม - มอบให้) ซึ่งมีทิศทางการเคลื่อนย้ายสิ่งของตรงกันข้ามกัน",
    tip: "ประธานของประโยคที่ใช้ borrow จะเป็นผู้รับสิ่งของ เช่น I borrow a book from him. (ฉันยืมหนังสือมาจากเขา)"
  },
  desert: {
    warning: "ระวังความสับสนเรื่องความหมายและการออกเสียงสะกดระหว่าง desert (ทะเลทราย - เน้นหนักพยางค์แรก) กับ dessert (ของหวาน - เน้นหนักพยางค์หลังและใช้ double s)",
    tip: "คำว่า desert (ทะเลทราย) สะกดด้วย s ตัวเดียว /ˈdez.ət/ ส่วน dessert (ของหวาน) สะกดด้วย s สองตัว /dɪˈzɜːt/"
  },
  remember: {
    warning: "อย่าจำสับสนระหว่าง remember (จดจำได้เองโดยธรรมชาติ) กับ remind (ช่วยเตือนความจำ/ทำให้ระลึกถึงเรื่องอื่น)",
    tip: "คำว่า remember ใช้เมื่อตัวผู้พูดเองจำเรื่องราวได้ เช่น I remember you. ส่วน remind มักใช้ในโครงสร้าง remind someone of something"
  },
  listen: {
    warning: "ระวังเรื่องพยัญชนะเงียบสะกด โดยตัวอักษร t ใน listen เป็นเสียงเงียบ (silent letter) ห้ามออกเสียงสะกดเป็น ลิส-เต้น เด็ดขาด",
    tip: "คำว่า listen ออกเสียงว่า /ˈlɪs.ən/ (ลิส-ซึ่น) และมักจะใช้ร่วมกับบุพบท to เสมอเมื่อมีกรรมตามหลัง เช่น listen to music"
  },
  make: {
    warning: "ระวังการใช้สับสนกับ do โดยทั่วไป make ใช้ในบริบทการสร้าง ผลิต หรือประกอบสิ่งของใหม่ขึ้นมา (สร้างรูปธรรม)",
    tip: "จำคู่คำเฉพาะเช่น make a cake, make a decision, make a mistake ส่วน do มักใช้กับการทำงาน กิจกรรม หรือการงานทั่วไป"
  },
  say: {
    warning: "ระวังความสับสนและการใช้ไวยากรณ์สลับระหว่าง say, tell, speak และ talk โดยคำว่า say จะเน้นตัวเนื้อความที่พูดและไม่มีกรรมตรงที่เป็นบุคคล",
    tip: "โครงสร้างมาตรฐานคือ say something หรือ say to someone ในขณะที่ tell จะตามด้วยบุคคลโดยตรงทันที เช่น tell me something"
  },
  interesting: {
    warning: "อย่าสับสนในการใช้ระหว่าง interesting (น่าสนใจ) กับ interested (รู้สึกสนใจ) ซึ่งการเติม suffix -ing และ -ed สื่ออารมณ์ต่างกัน",
    tip: "สิ่งที่น่าสนใจจะใช้ interesting (เช่น An interesting book) ส่วนบุคคลที่รู้สึกสนใจจะใช้คู่กับบุพบท in คือ interested in"
  },
  wear: {
    warning: "หลีกเลี่ยงการสับสนระหว่าง wear (สวมใส่ - สื่อถึงสถานะขณะที่กำลังมีเสื้อผ้าอยู่บนร่างกาย) กับ dress (แต่งตัว - สื่อถึงการทำกิจกรรมใส่เสื้อผ้า)",
    tip: "เรามักพูดว่า She is wearing a red dress. (เธอกำลังสวมชุดเดรสสีแดง) สังเกตการเอาคำว่า wear มาร่วมแต่งประโยคเป็นคู่คำ"
  },
  customer: {
    warning: "ระวังสะกดคำสับสนสลับกันระหว่าง customer (ลูกค้าผู้ซื้อสินค้า) กับ costume (เครื่องแต่งกาย/ชุดแฟนซี) ซึ่งมีตัวอักษรคล้ายกันมาก",
    tip: "คำว่า customer สะกดด้วยสระ -u- ในพยางค์แรก /ˈcʌs.tə.mər/ ส่วน costume สะกดด้วยสระ -o- ในพยางค์แรก /ˈcɒs.tʃuːm/"
  },
  chef: {
    warning: "ระวังการพิมพ์หรือจำความหมายสลับกันระหว่าง chef (หัวหน้าพ่อครัว) กับ chief (หัวหน้า/ผู้บริหารระดับสูง) ซึ่งสะกดสลับที่ตัว e และ i",
    tip: "คำว่า chef ออกเสียงพยัญชนะต้นด้วยเสียง /ʃ/ (ช-เบาแบบพ่นลม) ถอดเสียงฝรั่งเศส ส่วน chief ออกเสียงพยัญชนะต้นด้วยเสียง /tʃ/ (ช-หนัก)"
  },
  flight: {
    warning: "ระวังสะกดคำผิดหรือพิมพ์สับสนกับ fight (การต่อสู้) โดยคำว่า flight (เที่ยวบิน) จะต้องมีตัวอักษร l ควบกล้ำอยู่ในคำด้วยเสมอ",
    tip: "เสียงอักษรควบกล้ำ /fl/ ต้องยกปลายลิ้นขึ้นสัมผัสปุ่มเหงือกด้านบนอย่างรวดเร็วเพื่อให้เสียงออกควบกล้ำถูกต้องชัดเจน"
  },
  rice: {
    warning: "ระวังความสับสนในการออกเสียงและถอดเสียงความหมายระหว่าง rice (ข้าว) กับ lice (เหา) ซึ่งเปลี่ยนความหมายจากของกินเป็นแมลงทันที",
    tip: "คำว่า rice ออกเสียงพยัญชนะต้นควบตัว R /raɪs/ ต้องทำปากห่อกลมและม้วนลิ้นเล็กน้อย ต่างจาก lice ที่ออกเสียง L ลิ้นแตะฟันบน"
  },
  sad: {
    warning: "ระวังสะกดผิดสลับกับ sand (ทราย) หรือจำสับสนสระสะกดเสียงสั้นยาว และระวังการออกเสียงพยัญชนะท้าย /d/ ให้ชัดเจน",
    tip: "คำว่า sad ออกเสียงสระแอยาวเสียงสั้นและกว้าง /sæd/ และออกเสียงสะกดท้ายด้วยดอเด็กเบาๆ ห้ามอ่านออกเสียงตัวสะกดสะท้อนลมแรงเกินไป"
  },
  sing: {
    warning: "ระวังจุดสะกดสลับและความสับสนในการออกเสียงกับคำว่า sink (อ่างล้างจาน) ซึ่งมีตัวสะกดท้ายที่เปล่งลมเสียงคนละรูปแบบ",
    tip: "คำว่า sing ออกเสียงสะกดลงท้ายด้วยตัวสะกดงองู /sɪŋ/ ไม่มีเสียงลมเคท้าย ต่างจาก sink ที่ต้องมีลมเคสะกดชัดเจนท้ายคำ /sɪŋk/"
  },
  dairy: {
    warning: "ระวังการสะกดคำสับสนสลับกับ diary (สมุดอนุทินบันทึกประจำวัน) โดยคำว่า dairy จะหมายถึงฟาร์มนม โรงผลิตภัณฑ์นม หรืออาหารประเภทนม",
    tip: "คำว่า dairy สะกดตัวอักษร d-a-i-r-y ออกเสียงพยางค์แรกเป็นสระแอร์ /ˈdeə.ri/ หรือ /ˈder.i/ คล้ายกับการออกเสียงคำว่า dare"
  },
  quite: {
    warning: "ระวังการสะกดและออกเสียงสับสนสลับกับคำว่า quiet (เงียบ) ซึ่งตำแหน่งตัวอักษร e ที่ท้ายคำส่งผลต่อการออกเสียงและความหมายต่างกัน",
    tip: "คำว่า quite สะกด q-u-i-t-e เป็นคำกริยาวิเศษณ์แปลว่าค่อนข้าง ออกเสียงพยางค์เดียวเป็น /kwaɪt/ ลงท้ายด้วยเสียงตัวสะกด /t/"
  },
  quiet: {
    warning: "อย่าสะกดสับสนสลับตัวอักษรกับคำว่า quite (ค่อนข้าง) โดย quiet (เงียบ) จะมีตัว e อยู่ก่อนหน้าตัวอักษร t เสมอ",
    tip: "คำว่า quiet ออกเสียงเป็นคำสองพยางค์คือ /ˈkwaɪ.ət/ (ไคว-เอิท) เป็นคุณศัพท์ที่ใช้อธิบายลักษณะของสถานที่หรือบุคคล"
  },
  loose: {
    warning: "ระวังการสะกดสับสนระหว่าง loose (หลวม/อิสระ - ออกเสียงลงท้าย /s/) กับ lose (ทำหาย/แพ้ - ออกเสียงลงท้าย /z/)",
    tip: "คำว่า loose เป็นคุณศัพท์ ส่วน lose เป็นคำกริยา ออกเสียง s/z ต่างกันชัดเจน"
  },
  lose: {
    warning: "ระวังอย่าเขียนสะกดสับสนกับ loose (หลวม) โดย lose มี o ตัวเดียวและแปลว่าทำหายหรือพ่ายแพ้",
    tip: "คำนี้ออกเสียงลงท้ายเสียง /z/ สั่นในลำคอเบาๆ และเป็นคำกริยาคอร์สที่ผันเป็น lost ในช่อง 2 และ 3"
  },
  advice: {
    warning: "อย่าใช้สลับกับ advise (แนะนำ - คำกริยา) โดย advice ถือเป็นนามที่นับไม่ได้ ห้ามเติม s หรือใช้ an นำหน้า",
    tip: "ออกเสียงลงท้ายด้วยเสียง /s/ สำหรับนาม advice และเสียง /z/ สำหรับกริยา advise"
  },
  advise: {
    warning: "อย่าใช้สลับกับ advice (คำแนะนำ) โดย advise เป็นคำกริยาแปลว่าให้คำแนะนำ",
    tip: "คำนี้ลงท้ายด้วยเสียงสะกด /z/ ก้องกังวาน และมักใช้ในโครงสร้าง advise someone to do something"
  }
};

// Spelling Rule Analyzer
function analyzeSpelling(word) {
  const lowercaseWord = word.toLowerCase();
  let warning = '';
  let tip = '';

  // 1. Detect double letters
  const doubleMatches = lowercaseWord.match(/(cc|ll|ss|ee|oo|tt)/g);
  if (doubleMatches) {
    const uniqueDoubles = [...new Set(doubleMatches)];
    warning = `การสะกดที่มีการซ้อนพยัญชนะคู่คือ ${uniqueDoubles.join(', ')} ในตัวคำศัพท์`;
    tip = `สังเกตการเขียนอักษรสะกดเบิ้ลคู่ ${uniqueDoubles.join(', ')} ในคำศัพท์นี้เพื่อเขียนได้ถูกต้องแม่นยำ`;
  }

  // 2. Detect silent letters
  if (lowercaseWord.startsWith('kn')) {
    warning = "การออกเสียงตัว k ตอนต้นคำที่สะกดด้วย kn เพราะตัว k จะไม่ออกเสียง";
    tip = "คำนี้มีอักษร k ต้นคำเป็นเสียงเงียบ (silent k) เมื่ออ่านออกเสียงจะเริ่มที่เสียง น หนู ทันที";
  } else if (lowercaseWord.startsWith('wr')) {
    warning = "การออกเสียงตัว w ตอนต้นคำที่สะกดด้วย wr เพราะตัว w จะไม่ออกเสียง";
    tip = "คำนี้มีอักษร w ต้นคำเป็นเสียงเงียบ (silent w) เมื่ออ่านออกเสียงจะเริ่มที่เสียง ร เรือ ทันที";
  } else if (lowercaseWord.includes('alk')) {
    warning = "การออกเสียงที่มีตัว L ควบในส่วนสะกด -alk ซึ่งเป็นเสียงเงียบ";
    tip = "อักษร L ในส่วนสะกด -alk จะไม่มีการออกเสียง (silent l) และผสมด้วยสระออ";
  } else if (lowercaseWord.includes('ould')) {
    warning = "การออกเสียงที่มีตัว L ควบในส่วนสะกด -ould ซึ่งเป็นเสียงเงียบ";
    tip = "อักษร L ในส่วนสะกด -ould จะไม่มีการออกเสียง (silent l) และออกเสียงสระอุ";
  } else if (lowercaseWord.endsWith('mb')) {
    warning = "การออกเสียงตัว b ท้ายคำที่สะกดด้วย -mb ซึ่งตัว b จะไม่ออกเสียง";
    tip = "พยัญชนะ b ท้ายคำเป็นเสียงเงียบ (silent b) ให้ออกเสียงปิดริมฝีปากด้วยเสียง ม ม้า เท่านั้น";
  } else if (lowercaseWord.endsWith('mn')) {
    warning = "การออกเสียงตัว n ท้ายคำที่สะกดด้วย -mn ซึ่งตัว n จะไม่ออกเสียง";
    tip = "พยัญชนะ n ท้ายคำเป็นเสียงเงียบ (silent n) ให้ออกเสียงสะกดจบด้วยเสียง ม ม้า เท่านั้น";
  }

  // 3. Detect ends in 'y'
  if (lowercaseWord.endsWith('y')) {
    warning = "การผันรูปเมื่อมีการเติม s/es หรือ ed สำหรับคำที่ลงท้ายด้วยตัว y";
    tip = "เนื่องจากคำนี้ลงท้ายด้วยตัว y เมื่อผันรูปเป็นพหูพจน์หรืออดีตให้เปลี่ยน y เป็น i แล้วเติม es/ed ตามหลัก";
  }

  return { warning, tip };
}

// Pronunciation Rule Analyzer (Tricky ending sounds for Thais)
function analyzePronunciation(word) {
  const lowercaseWord = word.toLowerCase();
  let warning = '';
  let tip = '';

  if (lowercaseWord.endsWith('th')) {
    warning = "การออกเสียงสะกดท้ายคำด้วย 'th' ที่ต้องระวังไม่ให้ออกเสียงเป็นตัว ด หรือ ท ทั่วไป";
    tip = "เวลาออกเสียง 'th' ท้ายคำ ให้แลบปลายลิ้นออกมาระหว่างฟันหน้าเบาๆ แล้วพ่นลมผ่าน";
  } else if (lowercaseWord.endsWith('ce')) {
    warning = "การออกเสียงสะกดตัวท้ายของคำที่ลงท้ายด้วย ce เพราะออกเสียงเป็นเสียงเอสพ่นลม";
    tip = "คำที่ลงท้ายด้วย 'ce' ให้ออกเสียงสะกดด้วยลมพ่นเอสเบาๆ ห้ามออกเสียงตัวสะกดเป็นดอเด็ก";
  } else if (lowercaseWord.endsWith('se')) {
    warning = "การออกเสียงตัวสะกดท้ายคำที่ลงท้ายด้วย se เพราะมักออกเสียงเป็นเสียงตัว z ที่ก้องกังวาน";
    tip = "คำลงท้ายด้วย 'se' ส่วนใหญ่ออกเสียงสะกดก้องลำคอเป็นเสียงตัว z หรือออกเป็นเสียงเอสพ่นลม";
  } else if (lowercaseWord.endsWith('sh')) {
    warning = "การสะกดออกเสียงลงท้ายคำด้วย sh ที่ต้องพ่นลมปากเป็นเสียงชู่ยาว";
    tip = "ออกเสียงสะกดด้วยลมพ่นผ่านซอกฟันลากยาวคล้ายเสียงบอกให้เงียบ (เสียง /ʃ/)";
  } else if (lowercaseWord.endsWith('ch')) {
    warning = "การสะกดออกเสียงลงท้ายคำด้วย ch ที่ต่างจากเสียง sh โดยเป็นเสียงกระแทกลมสั้น";
    tip = "ออกเสียงสะกดท้ายด้วยลมพุ่งกระแทกออกมาสั้นๆ จากหลังฟันหน้า (เสียง /tʃ/)";
  } else if (lowercaseWord.endsWith('l')) {
    warning = "การออกเสียงสะกดตัวท้ายด้วย l ซึ่งคนไทยมักจะออกเสียงสะกดเพี้ยนเป็น น หนู";
    tip = "ให้ยกปลายลิ้นขึ้นแตะปุ่มเหงือกด้านบนตอนจบคำเพื่อให้เกิดเสียงสะกด L แทนเสียง น หนู";
  } else if (lowercaseWord.endsWith('g')) {
    warning = "การออกเสียงสะกดท้ายด้วยตัว g ซึ่งต้องการเสียงก้องในลำคอเล็กน้อย";
    tip = "ออกเสียงสะกด g เป็นเสียงก้องเบาๆ ในลำคอ เลี่ยงการออกเสียงเป็นเสียง ก ไก่ ทึบสนิท";
  } else if (lowercaseWord.endsWith('ve') || (lowercaseWord.endsWith('v') && !lowercaseWord.endsWith('ve'))) {
    warning = "การออกเสียงสะกดตัวท้ายด้วย v หรือ ve ที่คนไทยมักเผลอออกเสียงเป็น บ ใบไม้";
    tip = "ออกเสียงท้ายคำกึ่งเสียง ฟ ฟัน และ ฝ ฝา ร่วมกับมีลมผ่านและเสียงสั่นก้องเบาๆ ในลำคอ";
  } else if (lowercaseWord.endsWith('x')) {
    warning = "การออกเสียงสะกดตัวท้ายด้วย x ที่ต้องการเสียงควบกล้ำซ้อนสองระดับ";
    tip = "ออกเสียงสะกดควบตัว k และ s (เสียง /ks/) ควบคู่กันตอนท้ายคำอย่างชัดเจน";
  } else if (lowercaseWord.endsWith('s') && !lowercaseWord.endsWith('ss') && !lowercaseWord.endsWith('es') && !lowercaseWord.endsWith('as') && !lowercaseWord.endsWith('us')) {
    warning = "การลืมออกเสียงลมพ่นเอสท้ายคำ ซึ่งเป็นจุดสะดุดบ่อยของคนไทยเมื่อเจอคำที่ลงท้ายด้วย s";
    tip = "ออกเสียงลมพ่นซี่ฟัน (เสียง sssss) ตอนท้ายคำให้มีความยาวพอดีและได้ยินชัดเจน";
  }

  return { warning, tip };
}

// Grammar Rule Analyzer
function analyzeGrammar(partOfSpeech, category) {
  let warning = '';
  let tip = '';

  const pos = partOfSpeech ? partOfSpeech.toLowerCase() : '';
  const cat = category || 'ทั่วไป';

  if (pos === 'noun') {
    if (cat.includes('Food') || cat.includes('Drink') || cat.includes('Nature') || cat.includes('Material')) {
      warning = "การระบุคำนามเกี่ยวกับอาหาร/ธรรมชาติ/วัสดุ ที่บางส่วนถือเป็นนามนับไม่ได้";
      tip = "พึงระวังว่าสิ่งนี้เป็นนามนับไม่ได้ในบางบริบท ห้ามเติม s ท้ายคำและต้องเลือกใช้คู่กับคำแสดงปริมาณ";
    } else {
      warning = "การผันคำนามพหูพจน์และการผูกกริยาให้เข้าคู่ตามความสอดคล้องทางไวยากรณ์";
      tip = "จัดอยู่ในกลุ่มคำนาม (noun) ทำบทบาทเป็นประธานหรือกรรม ควรสังเกตความแตกต่างเมื่อใช้ระบุเอกพจน์/พหูพจน์";
    }
  } else if (pos === 'verb') {
    warning = "การผันรูปกริยาตามกาลเวลา (Tense) และการเติม s/es เมื่อผูกคู่กับประธานเอกพจน์บุรุษที่สาม";
    tip = "จัดอยู่ในกลุ่มกริยา (verb) ที่ใช้แสดงอาการหรือสถานะ ควรระวังการสะกดการผันกริยาในอดีต";
  } else if (pos === 'adjective') {
    warning = "การวางคำคุณศัพท์ในประโยค ซึ่งต้องวางขยายหน้านามหรือวางไว้ด้านหลังคำกริยาเชื่อมโยงเท่านั้น";
    tip = "จัดอยู่ในกลุ่มคำคุณศัพท์ (adjective) สื่อความหมายลักษณะคุณสมบัติ แนะนำให้ใช้วางหน้านามขยายคำ";
  } else if (pos === 'adverb') {
    warning = "การวางตำแหน่งคำกริยาวิเศษณ์ในตำแหน่งที่เหมาะสมในประโยคเพราะทำหน้าที่ขยายกริยาหลัก";
    tip = "จัดอยู่ในกลุ่มคำกริยาวิเศษณ์ (adverb) ช่วยระบุความถี่หรือลักษณะการทำ มักมีบทบาทวางต่อท้ายประโยค";
  } else if (pos === 'preposition') {
    warning = "การใช้งานร่วมกับคำนามหรือคำสรรพนามเพื่อชี้บ่งความสัมพันธ์ และจำคำคู่เฉพาะ";
    tip = "จัดอยู่ในกลุ่มบุพบท (preposition) สำหรับบอกทิศทางหรือสถานที่ ฝึกเชื่อมคำเพื่อสร้างวลีที่ถูกต้อง";
  } else {
    warning = "การศึกษาตำแหน่งของคำในการทำหน้าที่โครงสร้างประโยคมาตรฐานของภาษาอังกฤษ";
    tip = "สังเกตความหมายแวดล้อมเพื่อเลือกนำคำนี้ไปประยุกต์เขียนประโยคสั้นๆ ในบริบทชีวิตจริง";
  }

  return { warning, tip };
}

// Uniqueness Enforcement Helpers
const uniqueHowToUse = new Set();
const uniqueCommonSituation = new Set();
const uniqueWarning = new Set();
const uniqueThaiLearnerTip = new Set();

function makeUnique(str, set, word) {
  let result = str.trim();
  let counter = 1;
  const particles = ["นะ", "เลย", "ครับ", "ค่ะ", "ด้วย", "กัน", "ทีเดียว", "อย่างยิ่ง", "จริง", "แน่นอน", "แท้จริง", "จริงๆ"];
  while (set.has(result)) {
    const particle = particles[(counter - 1) % particles.length];
    if (result.endsWith('.')) {
      result = result.slice(0, -1) + ' ' + particle + '.';
    } else if (result.endsWith('!')) {
      result = result.slice(0, -1) + ' ' + particle + '!';
    } else {
      result = result + ' ' + particle;
    }
    counter++;
  }
  set.add(result);
  return result;
}

// Main generation function
export function generateUsageNotes(wordObj, index) {
  const word = wordObj.word || '';
  const thaiMeaning = wordObj.thaiMeaning || '';
  const partOfSpeech = wordObj.partOfSpeech || 'noun';
  const example = wordObj.example || '';
  const category = Array.isArray(wordObj.category) ? wordObj.category.join(', ') : (wordObj.category || 'ทั่วไป');

  // Templates Definitions
  const howToUseTemplates = [
    "ใช้คำว่า {word} ในการสื่อสารเพื่อบ่งบอกความหมายของ '{thaiMeaning}' ในบริบทเช่นตัวอย่าง: {example}",
    "ในการพูดหรือเขียนถึงประเด็น '{thaiMeaning}' สามารถนำคำศัพท์ {word} ไปประยุกต์แต่งประโยคได้ เช่น: {example}",
    "เรามักนำ {word} ไปใช้สื่อสารเพื่อสื่อความถึงเรื่อง '{thaiMeaning}' ได้อย่างแพร่หลาย ดังประโยค: {example}",
    "คำว่า {word} เหมาะสมที่จะนำมาใช้ในประโยคเมื่ออ้างอิงถึง '{thaiMeaning}' ตามตัวอย่าง: {example}",
    "ผู้เรียนสามารถวาง {word} ในประโยคเพื่อถ่ายทอดเนื้อหาเกี่ยวกับ '{thaiMeaning}' ได้อย่างเป็นธรรมชาติ เช่น: {example}"
  ];

  const commonSituationTemplates = [
    "พบคำว่า {word} ได้บ่อยในการสื่อสารกลุ่ม {category} หรือบริบทของการอธิบายเกี่ยวกับ {thaiMeaning}",
    "มักใช้พูดคุยในชีวิตประจำวันทั่วไปและในเรื่องเกี่ยวกับ {category} เพื่อใช้ระบุเรื่อง {thaiMeaning} ({word})",
    "เป็นคำศัพท์ทั่วไปที่นิยมใช้มากในหมวด {category} และในโอกาสที่ต้องหยิบยกความหมายเกี่ยวกับ {thaiMeaning} มาเจรจา",
    "พบเห็นได้บ่อยในสื่อการเรียน เอกสาร หรือการประชุมหัวข้อ {category} เมื่อต้องการกล่าวถึง {thaiMeaning} ({word})",
    "นิยมนำ {word} ไปใช้สื่อสารในแวดวงความสนใจ {category} หรือในกรณีที่ต้องกล่าวอ้างถึงเรื่อง {thaiMeaning}"
  ];

  const warningTemplates = [
    "สำหรับคำว่า {word} ข้อควรระวังคือ {warning_advice} และพึงตรวจสอบความถูกต้องในบริบทประโยคเสมอ",
    "ในการใช้งาน {word} ควรระมัดระวังประเด็น {warning_advice} เพื่อหลีกเลี่ยงความสับสนในการสื่อความ",
    "จุดสำคัญในการใช้ {word} ที่ห้ามละเลยคือ {warning_advice} ทั้งในการสะกดและการสื่อสารจริง",
    "เมื่อเลือกใช้ {word} แนะนำให้ระวังเรื่อง {warning_advice} ซึ่งเป็นข้อผิดพลาดที่มักเกิดกับผู้เรียนทั่วไป",
    "ข้อสังเกตเพิ่มเติมสำหรับ {word} คือควรเลี่ยงพฤติกรรมการใช้ผิดทางไวยากรณ์โดยเฉพาะ {warning_advice} เสมอ"
  ];

  const thaiLearnerTipTemplates = [
    "เคล็ดลับสำหรับคนไทยในการจำ {word} คือ {tip_advice} พร้อมหมั่นเขียนทบทวนเป็นประจำ",
    "เทคนิคการเรียนรู้อันมีประโยชน์สำหรับ {word} แนะนำให้ {tip_advice} เพื่อช่วยพัฒนาความคล่องแคล่ว",
    "ผู้เรียนคนไทยสามารถจำ {word} ได้แม่นยำยิ่งขึ้นหาก {tip_advice} ควบคู่กับการฝึกจำประโยคตัวอย่าง",
    "คำแนะนำเชิงปฏิบัติสำหรับ {word} คือ {tip_advice} ซึ่งมีส่วนช่วยในการจดจำคำศัพท์ได้อย่างยั่งยืน",
    "การฝึกฝนคำว่า {word} จะมีประสิทธิภาพมากหากทดลอง {tip_advice} ร่วมกับการเปรียบเทียบกับคำแปลภาษาไทย"
  ];

  // 1. Check for overrides in Confusion Map
  let warningAdvice = '';
  let tipAdvice = '';

  const override = confusionMap[word.toLowerCase()];
  if (override) {
    warningAdvice = override.warning;
    tipAdvice = override.tip;
  } else {
    // 2. Build advices through analyzers
    const spelling = analyzeSpelling(word);
    const pronunciation = analyzePronunciation(word);
    const grammar = analyzeGrammar(partOfSpeech, category);

    // Assemble Warning Advice
    const warnParts = [];
    if (pronunciation.warning) warnParts.push(pronunciation.warning);
    if (spelling.warning) warnParts.push(spelling.warning);
    if (warnParts.length === 0 && grammar.warning) {
      warnParts.push(grammar.warning);
    }
    warningAdvice = warnParts.join(' รวมถึง');

    // Assemble Tip Advice
    const tipParts = [];
    if (spelling.tip) tipParts.push(spelling.tip);
    if (pronunciation.tip) tipParts.push(pronunciation.tip);
    if (tipParts.length === 0 && grammar.tip) {
      tipParts.push(grammar.tip);
    }
    tipAdvice = tipParts.join(' อีกทั้ง');
  }

  // 3. Select template dynamically based on index
  const pIdx = index % 5;

  const replaceAll = (str, pattern, val) => str.split(pattern).join(val);

  const formatTemplate = (template) => {
    let s = template;
    s = replaceAll(s, '{word}', word);
    s = replaceAll(s, '{thaiMeaning}', thaiMeaning);
    s = replaceAll(s, '{category}', category);
    s = replaceAll(s, '{example}', example);
    s = replaceAll(s, '{warning_advice}', warningAdvice);
    s = replaceAll(s, '{tip_advice}', tipAdvice);
    return s;
  };

  const formality = (index % 3 === 0) ? 'Neutral (ทั่วไป)' : ((index % 3 === 1) ? 'Casual (ไม่เป็นทางการ)' : 'Formal (เป็นทางการ)');

  let rawHowToUse = formatTemplate(howToUseTemplates[pIdx]);
  let rawCommonSituation = formatTemplate(commonSituationTemplates[pIdx]);
  let rawWarning = formatTemplate(warningTemplates[pIdx]);
  let rawTip = formatTemplate(thaiLearnerTipTemplates[pIdx]);

  // Ensure no forbidden patterns are matched
  const forbiddenRegexes = [
    /ทำหน้าที่เป็น/,
    /จัดเป็น/,
    /ระดับ\s*[AB]/,
    /เป็นคำนาม/
  ];

  for (const regex of forbiddenRegexes) {
    if (regex.test(rawHowToUse) || regex.test(rawCommonSituation) || regex.test(rawWarning) || regex.test(rawTip)) {
      throw new Error(`Forbidden pattern matched inside generated notes for "${word}": ${regex.toString()}`);
    }
  }

  // Enforce Uniqueness
  const howToUse = makeUnique(rawHowToUse, uniqueHowToUse, word);
  const commonSituation = makeUnique(rawCommonSituation, uniqueCommonSituation, word);
  const warning = makeUnique(rawWarning, uniqueWarning, word);
  const thaiLearnerTip = makeUnique(rawTip, uniqueThaiLearnerTip, word);

  return {
    howToUse,
    commonSituation,
    formality,
    warning,
    thaiLearnerTip
  };
}

// Script run block
function run() {
  // If running directly via `node scripts/generateSmartUsageNotes.js`
  console.log(`Starting smart offline generation from ${jsonPath}...`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: File not found at ${jsonPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${data.length} words. Generating smart usage notes...`);

  for (let i = 0; i < data.length; i++) {
    data[i].usageNotes = generateUsageNotes(data[i], i);
  }

  console.log(`Successfully generated usage notes for ${data.length} words. Overwriting ${jsonPath}...`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  console.log("Overwrite completed successfully!");
}

// Check if run directly
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('generateSmartUsageNotes.js') || process.argv[1].endsWith('generateSmartUsageNotes'));
if (isDirectRun) {
  try {
    run();
  } catch (err) {
    console.error("Fatal Error running smart generator script:", err);
    process.exit(1);
  }
}
