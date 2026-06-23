module.exports = {
  Tagalog: {
    bagyo_prefix: 'Bagyong',
    intro: (n) => `Ang Bagyong ${n} ay kasalukuyang aktibo sa loob ng Philippine Area of Responsibility (PAR).`,
    position_label: "Kasalukuyang Lokasyon",
    wind_label: "Bilis ng Hangin",
    gust_label: "Pinakamataas na Bugso",
    rainfall_label: "Pag-ulan",
    movement_label: "Direksyon at Bilis ng Galaw",
    affected_label: "Mga Lugar na Apektado",
    what_to_do: "Ano ang Dapat Gawin",
    final_note: (n) => `Ito na ang panghuling balita para sa Bagyong ${n}. Ang lahat ng signal ay aalisin na.`,
    signal_plain: { "4": "PINAKA-MAPANGANIB · Lumikas na agad", "3": "NAPAKA-MAPANGANIB · Ihanda ang lumikas", "2": "MAPANGANIB · Manatili sa loob ng bahay", "1": "BABALA · Bantayan ang mga update" },
    signal_detail: {
      "4": "Sobrang lakas ng hangin — mapanganib na lumabas. Lumikas na sa pinakamalapit na evacuation center.",
      "3": "Malakas ang hangin at ulan. Ihanda ang inyong go-bag at maging handa sa paglikas.",
      "2": "Magsisimula ang malakas na hangin at pag-ulan. Manatili sa loob ng bahay at huwag malapit sa ilog.",
      "1": "Posibleng malakas na ulan. Bantayan ang mga update mula sa lokal na pamahalaan."
    },
    actions: { Evacuate: "🏃 Lumikas agad sa pinakamalapit na evacuation center.", StayIndoors: "🏠 Manatili sa loob ng matibay na gusali.", FindShelter: "🏕️ Hanapin ang pinaka-malapit na ligtas na lugar.", Prepare: "🎒 Ihanda ang emergency kit: tubig, pagkain, gamot, dokumento.", Monitor: "📻 Makinig sa radyo o TV para sa mga update ng PAGASA." },
    speed_unit: "km/h", bulletin_no: "Balita Blg.", final_tag: "PANGHULING BALITA", active_tag: "AKTIBO", no_active: "Walang aktibong tropical cyclone sa loob ng Philippine Area of Responsibility (PAR)."
  },
  Cebuano: {
    bagyo_prefix: 'Bagyong',
    intro: (n) => `Ang Bagyong ${n} aktibo karon sulod sa Philippine Area of Responsibility (PAR).`,
    position_label: "Karon nga Lokasyon",
    wind_label: "Kusog sa Hangin",
    gust_label: "Pinakakusog nga Hangin",
    rainfall_label: "Ulan",
    movement_label: "Direksyon ug Bilis sa Paglihok",
    affected_label: "Mga Apektadong lugar",
    what_to_do: "Unsa ang Buhaton",
    final_note: (n) => `Kini na ang kataposang balita alang sa Bagyong ${n}. Tanang signal aaliton na.`,
    signal_plain: { "4": "PINAKA-DELIKADO · Adto dayon", "3": "SOBRANG DELIKADO · Andam sa paglumayas", "2": "DELIKADO · Pabilin sa sulod sa balay", "1": "PASIDAAN · Bantayan ang mga update" },
    signal_detail: {
      "4": "Hilabihang kusog sa hangin — delikado ang paggawas. Adto na sa pinakaduol na evacuation center.",
      "3": "Kusog ang hangin ug ulan. Andam ang inyong go-bag ug moandam sa paglumayas.",
      "2": "Magsugod ang kusog nga hangin ug ulan. Pabilin sa sulod ug dili moduol sa suba.",
      "1": "Posibleng kusog nga ulan. Bantayan ang mga update gikan sa lokal nga gobyerno."
    },
    actions: { Evacuate: "🏃 Lumayas dayon sa pinakaabot nga evacuation center.", StayIndoors: "🏠 Pabilin sa sulod sa lig-on nga bilding.", FindShelter: "🏕️ Pangitaa ang pinakaabot nga luwas nga dapit.", Prepare: "🎒 Andam ang emergency kit: tubig, pagkaon, tambal, dokumento.", Monitor: "📻 Mamati sa radyo o TV alang sa mga update sa PAGASA." },
    speed_unit: "km/h", bulletin_no: "Balita Blg.", final_tag: "KATAPOSANG BALITA", active_tag: "AKTIBO", no_active: "Walay aktibong tropical cyclone sulod sa Philippine Area of Responsibility (PAR)."
  },
  Ilokano: {
    bagyo_prefix: 'Bagyong',
    intro: (n) => `Ti Bagyo ${n} aktibo ita iti uneg ti Philippine Area of Responsibility (PAR).`,
    position_label: "Nayannatoy a Lokasyon",
    wind_label: "Tipes ti Angin",
    gust_label: "Pinakanaranggas nga Angin",
    rainfall_label: "Tudo",
    movement_label: "Direksyon ken Tipes ti Panagakar",
    affected_label: "Dagiti Naapektaran a Lugar",
    what_to_do: "Ania ti Aramiden",
    final_note: (n) => `Daytoy ti maudi a damag para iti Bagyo ${n}. Amin a signal mapukaw na.`,
    signal_plain: { "4": "PINAKA-PELIGRO · Aglayas daytoy", "3": "NAPAKAPELIGRO · Mannakaparaso iti panaglayas", "2": "PELIGRO · Agserrek iti balay", "1": "PAKAAMMO · Bantayan dagiti update" },
    signal_detail: {
      "4": "Napigsa unay ti angin — peligroso ti lumuas. Aglayas na iti kasusuok a evacuation center.",
      "3": "Napigsa ti angin ken tudo. Ikkan ti inyong go-bag ken manannakaparaso.",
      "2": "Magrugin ti napigsa a angin ken tudo. Agserrek iti uneg ket saanen nga kumanayon iti karayan.",
      "1": "Posible a napigsa a tudo. Bantayan dagiti update manipud iti lokal a gobyerno."
    },
    actions: { Evacuate: "🏃 Aglayas daytoy iti kasusuok a evacuation center.", StayIndoors: "🏠 Agserrek iti uneg ti nauneg a bilding.", FindShelter: "🏕️ Biruken ti kasusuok a ligtas a lugar.", Prepare: "🎒 Ikkan ti emergency kit: danum, kanen, agas, dokumento.", Monitor: "📻 Dumngeg iti radyo wenno TV para kadagiti update ti PAGASA." },
    speed_unit: "km/h", bulletin_no: "Damag Blg.", final_tag: "MAUDI A DAMAG", active_tag: "AKTIBO", no_active: "Awan ti aktibo a tropical cyclone iti uneg ti Philippine Area of Responsibility (PAR)."
  }
};
