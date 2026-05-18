var players = [
    // לובאן
    { id: 1, name: "אהבת השם מקובר", group: "לובאן", seed: "Mekover" },
    { id: 2, name: "יובל פישל", group: "לובאן", seed: "Fishel" },
    { id: 3, name: "ניב סמיה", group: "לובאן", seed: "Samia" },
    { id: 4, name: "שון אשכנזי", group: "לובאן", seed: "Ashkenazi" },
    
    // השבח
    { id: 5, name: "יואב כרמל", group: "השבח", seed: "Carmel" },
    { id: 6, name: "סהר מחווי", group: "השבח", seed: "Mahvi" },
    { id: 7, name: "ניצן בן צבי", group: "השבח", seed: "BenZvi" },
    { id: 8, name: "עומר תלמי", group: "השבח", seed: "Talmi" },
    
    // תורמוס
    { id: 9, name: "גיל גורני", group: "תורמוס", seed: "Gorni" },
    { id: 10, name: "איתי רזניק", group: "תורמוס", seed: "Reznik" },
    { id: 11, name: "הדר גרין", group: "תורמוס", seed: "Green" },
    { id: 12, name: "אורי צ'צ'קס", group: "תורמוס", seed: "Chechkes" },
    
    // הלוזר
    { id: 13, name: "אביב לובטון", group: "הלוזר", seed: "Luvaton" },
    { id: 14, name: "עמית שבתאי לוי", group: "הלוזר", seed: "ShabtaiLevi" },
    { id: 15, name: "רותם צור", group: "הלוזר", seed: "Tzur" },
    { id: 16, name: "זיו מימון", group: "הלוזר", seed: "Maimon" },
    
    // הדורבן
    { id: 17, name: "כפיר פורטר", group: "הדורבן", seed: "Porter" },
    { id: 18, name: "דביר שאול", group: "הדורבן", seed: "Shaul" },
    { id: 19, name: "אופיר בר", group: "הדורבן", seed: "Bar" },
    { id: 20, name: "איתי דדון", group: "הדורבן", seed: "Dadon" },
    
    // ששון
    { id: 21, name: "אוראל זר", group: "ששון", seed: "Orel" },
    { id: 22, name: "שמעון רוז", group: "ששון", seed: "Rose" },
    { id: 23, name: "גל שמואלי", group: "ששון", seed: "Shmueli" },
    { id: 24, name: "אפיק שרייבר", group: "ששון", seed: "Schreiber" },
    
    // המיליונר
    { id: 25, name: "איליאן בביקוב", group: "המיליונר", seed: "Bebikov" },
    { id: 26, name: "עומר גליקסמן", group: "המיליונר", seed: "Glicksman" },
    { id: 27, name: "עידן אוסטרובסקי", group: "המיליונר", seed: "Ostrovsky" },
    { id: 28, name: "מור ברזילי", group: "המיליונר", seed: "Barzilai" },
    
    // עלי
    { id: 29, name: "יואש רון", group: "עלי", seed: "Ron" },
    { id: 30, name: "יניב אזוליא", group: "עלי", seed: "Azulai" },
    { id: 31, name: "אלון מזרחי", group: "עלי", seed: "Mizrahi" },
    { id: 32, name: "ליאור אביב", group: "עלי", seed: "Aviv" }
];

var groupNames = ["לובאן", "השבח", "תורמוס", "הלוזר", "הדורבן", "ששון", "המיליונר", "עלי"];
