/*
  iHeartEcho — Scan Coach
  Adult TTE (with SVG probe angle diagrams) + Fetal Echo (with CDN clinical images)
  Brand: Teal #189aa1, Aqua #4ad9e0
  Fonts: Merriweather headings, Open Sans body
*/
import { useState, useRef, useEffect } from "react";
import Layout from "@/components/Layout";
import { Scan, Heart, Info, Eye, AlertTriangle, ChevronRight } from "lucide-react";

// ─── CDN image URLs (clinical images from Lara Williams / iHeartEcho curriculum) ───
const CDN = {
  sweep:        "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/pwtXDnxySsEwDrgH.png?Expires=1804217678&Signature=RjLvt9Fs6sbCplyJuBgyeMa3moRHLqXSn5sgXkxbmEMk4zq8JyWJ3uhIlW4xlIMySe1iUKmIoWUsxw9p9gF96ayg9wsQylH0Nf9uugH4tvoyJl4HQcDNZU~eh1UNmWKF2MXx7bp9FDJAKsHla8WuCu6j7rQv50qEaNFCJOqs3cRpoGZNyQhABCzpMPopJJR-V7rzIrebcwNPvB8Zg8J5g2gIr3FW1OVQhuO8G4zOKG2u69c~yiQEdqnxcUd5JeBGdxlMIR5wvaKUn384nUBMhSO1rhEq6WN2eHyFtVZNVnWb0ZPPPP-zYaA5Y8tzPs70r~IuAvDl8uPMxmtIWx8elw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  fourChamber:  "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/CLtSxqdZHBcCumkP.png?Expires=1804217683&Signature=VOxwYTn3wPLwSAG0YLL5zwY5flGx68Jw1pRhxySaq219-kolUuyAnCsaARBvuiZ0EdFnpZjTg-9ikyzFAcXWaog7l~T17sj9zDG5p7bVmBDBQckRWNOCxJW4emBzz-qlyvSMpyXcBBLAPXas~OB5TV2R7GJwN86IbGuYujQnAlR5WsY2lnCC9DTrIjsqdXZS1C-EOjS8X3Gzj5gim6FQYDTRr4U-B28fH0~gbJxskTbEZpuXG20W9U-J9jtvnUHhK2GG-amhyQ13s4M82UX7Le~~JrGHXMjrdhM73ZLNyxJVgiYETzpPyj9GiTwu~Q2sr6mWZA5HjnRWKLfCnX1mww__&Key-Pair-Id=K2HSFNDJXOU9YS",
  lvot:         "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/HGAQPXIReqfTNBKy.png?Expires=1804217687&Signature=T-bR51dg0rI8c71vd~9W491Gd2a5cjZQ17GFS-RQW7zqc58OE4pAQbhUnMQl7Q0D8qj9gzdYl3BbkQX34XEYBGw~Ha7uD5j62v8cJ7Wk-wMPFdD1p-DhmCyMBhQBw-Hv3uOutyxhKZjOflH4MWJkkuuNdRGATanGjZGDdbu3lZWjLRJFoY3Y8nwQiUFNppYJZejwUgT~0nBkIEo5Kr0-igVQzPrDcmk7z0xhHhluDBgGknAbnW2LnrtLnusr0AK2~TyHUa9JzQ9RXX4VS3nKLpq4bopk1cLFz7YIM-AvsIgfFIIW2TFFFMEIOPRr9focbem9CDh7~TlzNFtqYh~FDg__&Key-Pair-Id=K2HSFNDJXOU9YS",
  rvot:         "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/zkMTTtxmdDbJFPnT.png?Expires=1804217677&Signature=V4cp7hA2Vxz5atyyJ8Yf0xJ3P8ZqagZR95YqE-M1oK5TqjCU4LF4Qhp2MduyF4N0qoHaWeyClQ5zMlUd29ACTMXbrFxP~6bNQIDqAz7jTtLxwykK3s9BHsyqhmHpomzoFJo~3JsDFUtaJU0EAe18sFHpWjRVZFWaP7jt9SyJwet2KLQMo-1Bv0QZXAmzG7R7QnaMgarZXI-EHqMexKk1Jet8iQRYBF3FkF3PQ9IiEvI4FggvcECes7ISyqrSprlFiNbP1iy5qrZzpAkSyc3p5hh8-Lh4FhUTk-vysmW4iHMkNm8KV0ylswYQCkpYAC3QHa0G8If-RroFHveEo8L8-A__&Key-Pair-Id=K2HSFNDJXOU9YS",
  rvotBifurcation: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/GJOvhZIPNnIgAQHJ.png?Expires=1804217677&Signature=DE1TDX9Xf4hMNW5e-clWZiIE978WXpn3gem83T5ZCyWak6ow~kp1aOal6LNqjRpC7fJ-UDQUS4carcg5RUNMWTNDQ~8Wb11MYxn0FfoujGIER3e0Iw56cOrJp2cEBCM5~DfQEtjtu3ELZW-wKLAtTuDfyYCeEquCqrE32eI4da1yy~2kpfdBHUR2Jl9ts3O4kwHwLmOoVnLhDiZGmF8EPHFeQgSLSwbDXGfk4QJ8z0WZwOT2B81YakA0VgAQbstTmR2~pZrT7OhHD1dg3-Pr3tYH0bC3yhRVd7ZhgnmK39sjd3ihjJ0fUf2fUCyhBOwGnviqKjs05pjM6a3Fnai6OA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  threeVVDuctal: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/tqIbdiftEiCjCtBg.png?Expires=1804217678&Signature=C6FTzFhtUc5TnxTwnvOO8K-~5y7vUwR9ZY-ndHTL~W6Y1~DU6JRY-CVCxtXqiM4npoJtq7BrgNNWQ7l8AdysUP2gB9g~I89JzVd0Xbxgrw6Cj2CLI5wAVpMTjDMBXxhHZyJtxNHHM8at81J2-aqsbxllARyMKMuq3yViQHLhZ7IiP~R14zDpFDn8KfXcpRTQbrYlJXu2G76L4Kuvn4G3rJVhpI4bEzAUKo4SNEeNJkHsH9YQpuqyzNQ93uPzpDxzwk09wR9CoyUMW-ZGBm~JKB6KNBnYSWXWY~Qrbp5OBuPk3doqj5n7vFqZO3kmQ1IS89rWDrDwxGilXuYqb8o6hA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  threeVT:      "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/wXdhYtXSmjdILGLY.png?Expires=1804217678&Signature=AbYSjgEbF67spokqJE6r0QiY-amruwTq9ND5JdHR0VAnHM2LUJJcqwwVKI6xkXbbXFXthhMfWWVhNPrQYoWhfuKiejlnwBD84A2MRxS~PHqlkobnY1mshHUA8Mk1a1gvxk0b9rmy7TPiO6PDNBr2yeP0d4HHB5qveWfZV6Ef6N8ujxuxsWUGDGy4H~FvgwksZGIaPRCznwi1G5WEp3Bx-8jlj6FkvQTlJsRo-mhb5REPXlqDXDKtgzQW-t6Hrl3lmxYUgFA~3Mp4uM4WMbf--Oq0CSi3nMlNIIDWuCRZ22CSG8C9C9-cl6K0BquXgBoKRxJ8Xn0fRzWaErym-y3-Pg__&Key-Pair-Id=K2HSFNDJXOU9YS",
  bicaval:      "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/BFlsjzXHQURCTgXJ.png?Expires=1804217678&Signature=Rf32-AAr~a1IBc1WxrGdLCuI4XZPy9ov4CEuKdg68bE~b71p8o52rAKqCbi5UfU6SAhkJI6fGPcWLli5B90y24re5WX2Q9wOIXBefLgEzPLnHY9a~EniZUij48wwPA6De0eQ7UPgVSMAgswXcmOYcNMM~lsO3PVp-3F1gVyj0Y0RD4UACDSyxMXgZAYzaTfxzLTIjHI4zbXhxZMFnDL8w3zr5FUTZefcqrV95fYKwZQm2d3mrx3Lw~8XTIWcEQZ1uOx~2GJnLopHAvOPtJqhVjLOLvr9~7X~1JuTGs3YTz3R6g4JJjmaX17xJDvFo3b2M6twyqGU~H0DqZwCL1t0fw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  aorticArch:   "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/TKlJMYtocuCBKwbl.png?Expires=1804217678&Signature=eojPUlijwGlowVGglOvcT3zQY-LR8gK11wJQnfC2qZlnkawEQfTx~e1s8wviyiQcQsp7dMfGrw5NN8m98ofDYz7OYUjLTd7jzv56cr6X5m12PJRJndtZOiNvSBd3QNgHNZ3gZaV3QaiM-ozMrtEQMZWL11l0LhmLcTGnc9wULnDMyqTm1RvcBrbZMZLagDQkuAO~fQOtDHZSDVh2DVXfQtC7teCqYSUwVGBM0NpG6T0~ocdAs2~Kn00TrPLtjo32iPwq8U3ndb9c0lRT75MMwUAZG4M5KPed--PbAYiS2UK465P-5-~DCboWpSXbbsCqzHi74BAd8kNv15-1K67dug__&Key-Pair-Id=K2HSFNDJXOU9YS",
  ductalArch:   "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/bvrodzhIwNApIBbC.png?Expires=1804217678&Signature=oZ4LyOOcoHxUHXmU-o~9dtNQd1~0O9GQRuEVBx9Bbg0NKvsBOtAhAeIBbWJJe2AJ-AlfN3N66m7sNGnvKorUkixgyqosSbhG7bnpmZoY~aFIPjDMn0Vtd0t3QrIrzmRe3JIY8frK0xo8dBhQeHI1HjKsHdHebttaz5vjkha34mBXEtFVUMPAbK-lQMeobbcZkpipsuJ1aYnIAslKeZLJwr8-d7D4LrB4oYf70rKffMyeZZ3XCLKPm19tUAktTgomn0UfIy9jCHQgjPWHMP-tNob~MMtURGRM0uzX1Vq1rsojj2pwsUYpz6haOGG1KBt1f8OU2IRLyK4oJT6aoMHsxg__&Key-Pair-Id=K2HSFNDJXOU9YS",
  bcv:          "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/vRqqlQSitiQuZxSJ.png?Expires=1804217678&Signature=XacRQ2a0loWf3gCJH2fWU~KTUNBawZUALgm6ZeTq5bTLjnycjlI15ykab6dSXGO82fiuyczm9ePOC1vwpJ76ZyYkS7f2ZHO~BAGREmsYOxdmb-jDbaZP3e9MfC9F~5JNFeQPcFXXEEKKAkFbhtYfF8nOub3tZHkcuonV~JW3Yr5rDSOAn6KKAHRttn2zy895eBqOzLozU2eHtWwSN3Pcfan1y7fZBeyrz-26R0wj~nWDcWSC6tPEg90g5ycjMx74E5LAC2UzXJiBVVVoRvf~IZsdnKk7WWqOEWDLW9rMRYPIA2PkapLOs7BM88PV0q0McPe0N8kZZiW4p5AGi-fsDg__&Key-Pair-Id=K2HSFNDJXOU9YS",
  // New diagram image for Abdominal Situs view
  abdominalSitusDiagram: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/ZMTandoYWqCfTVQG.png?Expires=1804219541&Signature=FFw3aLQMd681Ktzg35mIlyajenWZXm5SUyNpFH4Jy~AHqYVioMYaUNqtxZ410Uq9GoNPRcBd6W~zQ5~ddPDzfo7jHB6sc7B~DlmsQcWFSYre6CLyWRhxYC~CBrJk2bq0oh84jf5WLgoc95f70H3wOc~JamfxXXSOE70VM~~2jd~2rQOm5vkLA6QzLMvZANC2XAPlaAoKhGk-Hkfjv4Y7WTlcudoywE2Wmkk-5zHslwi~DDh9UJjeS6HE6wNVfb0Gu9uytxKRAS3r65i8TeH4zNq7kZStckHZmpiPOCgEFg3nKq7UZFIfnyanhi37z9~E3sS5MSbrQX89pvWMEfaHnQ__&Key-Pair-Id=K2HSFNDJXOU9YS",
  // Echo images for each fetal view
  echoAbdominalSitus: "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/oJAqycRWgaGIHUKy.png?Expires=1804219546&Signature=r2K1V3-P-GnIhbORET95gATIoTUFWXd4AxZeqCiDXB1yXQJUXk6rojvOLenXmx~VmkqxROoBJmxj6onaUz62nTTQY4QDKKW1zhZvxCH9yANnYkXZPy-nsmnEeqQCAq~CutfguKZSfj5wub~YDQ7voe2y38IZQqC6TcG-rk7ZElwB~GRqAXhFwJ5p3zlfzhCWZXt8SyXk0rCtfdGVuz1JYqz9QMZ3mGBkz-Zbe4ETNy~Rc0f1OmWAL0M9NDGp~xKExY9cpKO581Z6MbeV9aJ3IbdNMwy~7xsBtXbuJPGxt880EuruzfcVom0mlQj7I9uGX-Fa-1QlQ9Rp9FCxJB9njw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoFourChamber:    "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/UQGEYwBFlZYthyoF.png?Expires=1804219530&Signature=b0a8Ysvl26jpBBEbu3RDvvYmaSVNrsnjDIvwauCxmMYKJUOrQUS1uisTdJub3Iy-90pQ~tCuiMiiBRqGdmQrtQpk5qXFcSfZ4paIdlVhSeBqO6kdNPdUj-PFq1fGfRX2bFZjXJBI7JVfiu3Nc0Y6EGHX9GRjxZ9KAjTw1BWPni0FAjFO~JmVcvKPdaBE1IBQZNeO1-OCS92YQvo9PfFzIJ0kQeHlxtnFIJgoQlfZ6P~Dal~uIPAjtTS~T2cxYnp~RgQh~Rga0eXEQ4rwsnOcQr8g5GZPWaB7znpEHfItI8TZeYpDvIxhSPnCjkzlPmBAU--GK-RoYevdinTjv9RiUg__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoLvot:           "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/hoZUvkgoRxGKVwoe.png?Expires=1804219530&Signature=M-OEK-mIAzB6Sgcz78hZtMDxPiByalz~AQ28ja7U-XilYeDGmrjkgmVcOIO9vLYwRhUKIh62XpvR1QRvJui6-reviwnbeqvbY-ITwK4D6mwLot27xz6IHuVvxfVWfcaX--B0K-bQhUcqMz2ByEzxpItGw3tXFdPUtqktfZV9mt6r980qDqKayMINQDzuTBP~66CIbtA9Bb5qCjqq4Src3MK0vygzN2k32YIYyjSqC8ASeGfrDrn5vDuTuzb~GAwkDptWcdBqUbdsGcvHZWOK72Y2EZdwH7wqbzTxkwbFbq1WjujD4iEzK7KhiF-RSeMDaWnwU~dxt~EkKmMlY~JqkA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoRvot:           "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/CNAfQgEEeAnLOrZf.png?Expires=1804219531&Signature=INVCtOLqj6QtazMvh9ls3bqrHfhT35s1s0rwtwRzwupUtbLLhEBAiLvQ4~6g9-SlhQ~30R4XE5~xxj~662YoOwv3dQCw8zR3vjrYa2SiS-yzufrdB5WHWkTdNJOOXDCZbO5pO2Squ~BhlqTJkxJ6j1odLoslvqubIIL83NytJyYU71Y-0qR0aO-J2oYKUeSXQqS1uNzWtEwiWn0aH-c2lqfvlQ2~pRnw~TE-eQobOoWZLngdX5gku7KXocGHWhhjyA0a-Y5JniSyb~V4eFnMyxYWpAO5OzjJyTwMvYkzIJiUc01Mz5OpyTt5IcpdjOCA1HxHdNVop8r51sXLBthUcg__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoRvotBifurcation:"https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/kjNujbopvYeXuXRd.png?Expires=1804219531&Signature=EtSFpEBvcFTPWEa5CBlr89rmS8MMPCHN4QwtQ1TGHb202PKKEEeYq5MadcYUTWLq7miAnnnwXls7ViZu~-349O4ki3lmeRRjGlIog7m4KazgEoJmQX6jzm2kgtCZS6-SjbTUlEK4tiGbkJofCe~hq7E-q9xULBwy2pyF1tYn6mFrIYOOzBJgSohf0KSoxWFkSjpY7UTDMGtIUmJb4A0i~RO7Wb~~oIvqZfQOzLZMeOfINzdG5r6SoJoXaCLWiUmNOnN4SDvIMj7kbPQbM9e4~wyAdH5HOrYENIfBMZ2-8L1aZQpnX6xXo3~ksdUxKMJsahORgJYa0sa362bD9TSUBw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoThreeVVDuctal:  "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/tqrBgqVGzZDYoeXM.png?Expires=1804219557&Signature=CDFJzl4ikVN-wm7kjYAzoizilDf9Iv6EBn~R71yWirmTgSC53Poukur~PZNKd26ndivYsur2qwZk3Ek7XE9oFNED3UhQVk0IHnBm4t8wm6lHZsjRH7dUTuGGKLYVC2BiPm6rHxBTTn94UtcOvAmlsYyazQgGiaKp5BkNcOQYYZaeLS-yQ0hkJmBVbGreICidn6NmxWkgP-ies5kHeJg6IO72epeSJFV0QfgxLVwLUp0jZ1D5j0cL17GwVsk1RtDbJ09Q6VN~IORZGWznv7EGAw3t0317AJ~2i5p6ZyZdKKMoDQOlCQcKP8ITqsOe~99Sc6AVkmxFzFxaYfmjZdQE~A__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoThreeVT:        "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/MZUkvGpgWGlkDXov.png?Expires=1804219552&Signature=I0l3fbi~sagUc5Mr-IbUAS4JYVoLmt1vuOrq~xdcYuMTrIXXJXwISFKPgo9-WbHGc1WtaCrnTDfZ~3v-Daip92tMuned96PywjakhET~e1Pom5CkUbGLIH4~4AHFzwR~2mRa9Xi5~Fd4FCZEgXNbRP6wg0CcX3MhGk5zenDifKYvzad7mTtlahILnFTr8UaQRTFH95BSvdjW9KAcq~PnLQ9J8WMxHeudIeJVlv6NYlKGApfecFo-o~7I24K41b~cbOmBPsdTXabZ5NVKLG4QySR8wHTtPNpKoMWKLgw56fY~Pb9qjeqgi95OZeAvQb~wymSEONvF6yW5EerLeZK2RA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoLbvc:           "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/VizJommhsipdzIeA.png?Expires=1804219531&Signature=XYTjAWg9IqlCByRfuqWLeJXN-QsTAi-KPfu5csTu50s41cV9Q1DlYx6bwvbg69-Aakl0Uft0rMPQcD96hppPaDU-QuNYZOgu8x0-66yMpIqD5mcny7cTMaQIN-lIfqUCGfo5uHVHDSjZcDcACv1PogJLqYu7RTUCbvRVx4GZNp7JW5xTY09cznC6YJFT60gIUvx9nso6rHc~JlsCMjJ1GXiv~7hIab~PEghsjLIam2Pxpyv8~qIiPfByRfYeJz0Y9dl3l4NQ5ND5Y9XREXmqm6slDL10~YEiItHVi6FeHczsEcTd8MZj1A~2D3-il5DWnvdSYVfc~k4F0Sx1GU3QUQ__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoBicaval:        "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/jLbSEOMlpJNaDUKN.png?Expires=1804219530&Signature=oblPSfgoLq-Iv6QD-~BEHHNLOy61FXtoQPQ4Rzq7RKuxjLTVvzjXD3ntFBsHc33JDmbwHkBIE-63HCgTeGE78A~BBQA5XbfgV1n2Ha9qdQSVv95rbKYn9KatM3ghB7pZSCu8nQR31Zf5s6WcXpl8yiOonL6FQnnSfVwyzTOUtIqgysGjOfp0VYnLJRlpe8IES6PnX4Y89al9CP0ePuGBKWcrZqW2UMlIeSM8NCpnv~Cjpq~CGzXLu-phCjSPudEC264vas4ZijWNCc7UmO0G10SY0qYdbXKR~qA7XhkKNCFuKmw2xntMYahlpJr3KrhLfK-EKwpd~3QUb4Fw62Q1eA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoAorticArch:     "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/OnpmABKkYpNRPzKQ.png?Expires=1804219561&Signature=lzxcqAi29hHfLEK6ULXL9oCFOV7gEFurRbAb5a-KnZwD9RhQwS4rhrCJ6bChC0~FhHMjnPX5aUm2BmolOpYzj5KRj2i2nERZhicJDuflA3YQJVfQMDVh579vouzuaMb~WWfYMcwGhlOJGSWq1XTqdq9AM5ximb1mkQLz~Zitc3rKVEbDxLztxDGXaLxS5qjE0kPlB1X2rSKiexZ-ZaVBkjDnZjX1XqJuq-d~AY8pLOrgK3X8Lu-SnFc4kJ4RyF5AFcKomwz6UmaLPwrfH8OiGg2-43F2botDRl7uLfPuNHJsDrhyMnR7LVRSsWeUr59EB~Sacw2kjmZWseUQ8OOKow__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoDuctalArch:     "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/yfagHApsvpUglKVm.png?Expires=1804219531&Signature=vktlvQfIIQvfgpTqyFJkYq8t054EoIyIpujqvL5zoywI35OMTh8VqSY7wLsHlIHsFALzd8Nl7Ao~ZZRFAXaQSr-vishsf2Z2RBGW-UZK0I-G7uAYdEmTNH-UoQ4jtSNlX3anQZH6ao3eQN3lAdPKJpl~DRP1RPaedmG1XlSsLCS0WGDDo4bksUlRxVD8Bv~jvxXov6CeWiNRVs6C1vrxHpMZz3SOsG89MWMPads1r~xG4UQeVkwwdho5AMqmRsavQxzlA6dNlx~2rZkVDeER4fERShjAu1L-jiTP49Ab4scLo2jTr~KdWkqT-dOzYpmL~wtQ6JU1BCU7BJ0waUhytw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  // RVOT Short Axis and LV Short Axis echo images
  echoRvotShortAxis:  "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/isfAjCTuYjsHReYQ.jpg?Expires=1804219532&Signature=fTuq02MnH3H~M~o8rHrajM6KsQFo8QFxhTrJicJgWGBgQqogk5W2RNzdpZD-HSzm~72XMiX-QezkuA5F0Xh3qYw5G8gcuXFDgKkffwJ~D0NMPA3B1R9jrzcug6GISttUzixKypx08uCQI1sBWexnSftDBTZU5FY9SxKcYGvl9sOcmumOYTDYt-G0UJcDZlvyqk9Bcc~EUa1WJF0C72paowdHA0zHCSrdr2piwSTCPfR~e69Pqk3Vt6puv2MiFv9iRyuiPUR0dt048QOR4xmsSkkn0-qz922e6EwxCWGyzxpXJN86bGk4nFrisdVbyDeIcCwbdstqEBYCnQXMsdr7CA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  echoLvShortAxis:    "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/iNdFjSbLMjrYmvFc.png?Expires=1804219532&Signature=mrXbXlZqr1wk~7Q8f8p4sDFBy5XUwuGawzmQMD~LLw~eL-aUZ16Q9nnUA-C1XH0FV-o8OnlZmmh2HnBRrXWsNxt0S8KApPFNCFQ~obHlr8GL45rSkUkAEZH6~GSOwCIKXXtYnd~GDVn7m2V4zQgb~pqKwlxbt~W2qCdkk6DzDfRb8ZzxsDUpm4EFXmd-wwrxSbxC5HJIsGScWFjkJoDPajig5rBfP5CurgXOT6DTAxQ6wDNs4z2qgw54VAL5CWwevn3DWmyZl7E4-J2CDKzgOv6uEvepchkZA59y1~XCmzWTDNyipCXJERomlfp6PM4fzLsHsDucr6mzPnbnpRVoTw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  // TTE transducer positioning images
  ttePlax:       "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/vRjcMyvkOCWAequN.png?Expires=1804222380&Signature=NWgX7uVrRSRBade2VRC0MWHTBNpywddX1pCEI~~h3SLCstwhhux9hCUKQmvvtfcLG7Z2D7GdqNCCPUaM~om-xlZNnTkn0HzYIZklmrBLfGeJ3bP9gMz9WB2dyAkkQkL3WYGsljt0--JyIHtZg4zPJiB-Mh7JE-QR6XHWIqcJyrA1zBCM6Z2BhZBsTpt9KsXl0i0g-4oWRIHJP2WyARvlfhV771fVetgyFVfOwPurKMuCqWD0cv7BsIsVjW7IN3govRGy7wzbLPZ6XagNLHeVLnSmauWDf72UMOt8assXc54i5P9bAcl6OkyyUQl7T81L~XulcH6XciNqgW7HeufZxQ__&Key-Pair-Id=K2HSFNDJXOU9YS",
  ttePsax:       "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/KXjnLvWWXfPggLKt.png?Expires=1804222380&Signature=jFekXBPNtNbWSrPX-ctcbTj9ahRkfxj6cQX9aUTWw-dXug2ATf1wAZPG~Y2mDj00jzEMqhP-s5JXyWHqKdyhlZCoiMA0DjMTlUGCznbCwvLjOlCe9G1AR1lJ0VQCmCD6KdUTN2MX5Ts9U6T4GFwOA0Le9pKIsn9Xu4clO3UgTd8TfOm0937gohN2dVm6jeddwd-do9RS-dfcO6F6WyQsvvQfP-7ao837HhjuDVB3hCbq~TOKtN0nr5d713L2zV0HEnFTXOxA34CBOt21JOLomU7-6A94h4WS9wPfj-EODS-efcPNygf4-Bc4N3qohKLxqK6WBi4BJgzQsMi~bysmLw__&Key-Pair-Id=K2HSFNDJXOU9YS",
  tteSubcostal:  "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/szLIUWyZOqjzZEWM.png?Expires=1804222380&Signature=CFd~QwKBjB0mzLnLBbP3fadCkYErEeYqNAW7fxFIDMqPX7QlVMV~lBzXh9xpT4HU7JiFW~DJg2i4brFkq8iwRZ88V5dFs-M153xb1qo0FSu8FzcYEO0JX~5WP9zzXvrp5JfXveNi0vGWyXhj84uutRztWMbdO3-xhfnHKIGF9OE-ZJwnttHhnjDsp0mTED1gMlbn9iJZIAsFTShCAj~LPf1l1HA2zihJNnafkUWU4nbD24bCESHEDRYiVAMHf9IT3BXhhh9J75faa6wYGyb516kCRp5NYPksLtVe3QJ1T-oUffKD2QtvRGBhKj089Eo~ZJR8LrOA3jwd3hz9S3r0jA__&Key-Pair-Id=K2HSFNDJXOU9YS",
  tteSsn:        "https://private-us-east-1.manuscdn.com/user_upload_by_module/session_file/310519663401463434/pBYDLdXqRkBGWZHX.png?Expires=1804222380&Signature=kHjGMgHGDX1KhABM4dOGG66Uzw9QzvTq9nZdMbY6tloMXFZzaaR2EtFvxFdBNpyCeUcYLTYrCMmAdJoEko4onyLhI6ZmkoOrO8o2mZVyFIoerNMu5ILDtiuX4z8~D4XjhgZZ~h3Qt3r9k6ZiETDpi56KSNIcfrCXwa6uW55l-hrm0Fsdri3fH8M2RdcHfskNyrURPqxnZeVthv9ZTyjw7~cl5-LtvMFJ8YDR~DrMp79sTZ15bW64pu3j8CPDoTbbxiNdRwt7AAbhQLzLsR2KxkwxNL~6l~ZGjjRw9bXPak93wTY3k9eXOkxGehzQLco-YMp9vzq6FgD~hEaDWOmzUQ__&Key-Pair-Id=K2HSFNDJXOU9YS",
};

// ─── TTE Views ────────────────────────────────────────────────────────────────
const tteViews = [
  {
    id: "plax", name: "Parasternal Long Axis", abbr: "PLAX",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward right shoulder (2 o'clock)",
    structures: ["Aortic valve", "Mitral valve", "LV", "LA", "LVOT", "Descending aorta (posterior)"],
    doppler: "PW Doppler at LVOT; CW through AV; Color over MV/AV",
    tips: ["Tilt probe to open up LVOT — IVS should be horizontal", "Descending aorta posterior to MV confirms true PLAX", "Avoid foreshortening — LV should appear elongated, not round"],
    pitfalls: ["Foreshortening underestimates LV size", "Descending aorta mistaken for LA"],
    measurements: ["LVID (d/s)", "IVS (d)", "PW (d)", "Ao root", "LA diameter", "LVOT diameter"],
    color: "#189aa1",
    transducerImageUrl: CDN.ttePlax,
    // SVG: anterior chest, probe at 3rd ICS LSB, notch toward right shoulder
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,62 Q58,67 42,83" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,82 Q56,87 40,103" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at 3rd-4th ICS LSB, tilted ~-15deg -->
      <rect x="68" y="78" width="16" height="30" rx="4" fill="#189aa1" transform="rotate(-15,76,93)"/>
      <!-- Notch dot toward right shoulder -->
      <circle cx="60" cy="72" r="4" fill="#4ad9e0"/>
      <line x1="60" y1="72" x2="43" y2="55" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">3rd–4th ICS, LSB → notch 2 o'clock</text>
    </svg>`,
  },
  {
    id: "psax_av", name: "Parasternal Short Axis — AV Level", abbr: "PSAX-AV",
    probePosition: "Left sternal border, 3rd–4th ICS",
    probeOrientation: "Marker toward left shoulder (10 o'clock), rotated 90° from PLAX",
    structures: ["Aortic valve (3 cusps)", "RVOT", "Pulmonary valve", "LA", "RA", "Tricuspid valve", "Interatrial septum"],
    doppler: "PW/CW through RVOT and pulmonic valve; Color over TV",
    tips: ["'Mercedes-Benz' sign = normal tricuspid AV", "Bicuspid AV: 2 cusps, fish-mouth opening", "Assess for ASD at this level"],
    pitfalls: ["Bicuspid AV may appear tricuspid if not fully open", "RVOT foreshortening"],
    measurements: ["RVOT diameter", "Pulmonary valve annulus", "AV planimetry (AVA)"],
    color: "#1ba8b0",
    transducerImageUrl: CDN.ttePsax,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,62 Q58,67 42,83" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,82 Q56,87 40,103" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe rotated 90° CW — horizontal orientation -->
      <rect x="58" y="85" width="30" height="16" rx="4" fill="#0891b2" transform="rotate(0,73,93)"/>
      <!-- Notch dot toward left shoulder -->
      <circle cx="58" cy="85" r="4" fill="#4ad9e0"/>
      <line x1="58" y1="85" x2="42" y2="68" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah2)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Rotate 90° CW from PLAX → notch 10 o'clock</text>
    </svg>`,
  },
  {
    id: "psax_mv", name: "Parasternal Short Axis — MV Level", abbr: "PSAX-MV",
    probePosition: "Left sternal border, 3rd–4th ICS — tilt inferiorly from AV level",
    probeOrientation: "Marker toward left shoulder (10 o'clock)",
    structures: ["Mitral valve (fish-mouth)", "LV (circular)", "Papillary muscles"],
    doppler: "Color Doppler for MR jet origin; PHT for MVA in MS",
    tips: ["Fish-mouth opening of MV — both leaflets should open symmetrically", "Identify A1/A2/A3 and P1/P2/P3 scallops for MR localization", "Planimetry of MVA in mitral stenosis"],
    pitfalls: ["Oblique cut gives oval LV — reposition for true circle", "Papillary muscle level vs MV level"],
    measurements: ["MVA planimetry", "LV short-axis dimensions"],
    color: "#1db6bf",
    transducerImageUrl: CDN.ttePsax,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,82 Q56,87 40,103" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe slightly more inferior, tilted posteriorly -->
      <rect x="58" y="98" width="30" height="16" rx="4" fill="#7c3aed" transform="rotate(-5,73,106)"/>
      <circle cx="57" cy="97" r="4" fill="#4ad9e0"/>
      <line x1="57" y1="97" x2="41" y2="80" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah3)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Tilt posteriorly from AV level</text>
    </svg>`,
  },
  {
    id: "psax_pm", name: "Parasternal Short Axis — Papillary Muscle", abbr: "PSAX-PM",
    probePosition: "Left sternal border, 4th–5th ICS — tilt further inferiorly",
    probeOrientation: "Marker toward left shoulder (10 o'clock)",
    structures: ["LV (circular)", "Anterolateral papillary muscle", "Posteromedial papillary muscle"],
    doppler: "Wall motion assessment in all 6 mid segments",
    tips: ["Best level for regional wall motion assessment (6 segments visible)", "Anterolateral PM: LAD + LCx territory; Posteromedial PM: RCA territory", "Compare systolic thickening anterior vs inferior walls for ischemia"],
    pitfalls: ["Foreshortening makes LV appear oval", "Near-field artifact from ribs"],
    measurements: ["LV EF (visual)", "Wall motion score"],
    color: "#20c4ce",
    transducerImageUrl: CDN.ttePsax,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah4" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,102 Q56,107 40,123" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at 4th-5th ICS, more inferior -->
      <rect x="58" y="112" width="30" height="16" rx="4" fill="#059669" transform="rotate(-8,73,120)"/>
      <circle cx="57" cy="110" r="4" fill="#4ad9e0"/>
      <line x1="57" y1="110" x2="41" y2="93" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah4)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">4th–5th ICS, more posterior tilt</text>
    </svg>`,
  },
  {
    id: "a4c", name: "Apical 4-Chamber", abbr: "A4C",
    probePosition: "Cardiac apex (5th ICS, midclavicular line)",
    probeOrientation: "Marker toward left (3 o'clock)",
    structures: ["LV", "RV", "LA", "RA", "Mitral valve", "Tricuspid valve", "Interatrial septum", "IVS"],
    doppler: "PW Doppler at MV tips (E/A); TDI at annulus (e'); TV inflow; CW for TR (RVSP)",
    tips: ["Apex must be at TOP of image — rotate patient to left lateral decubitus", "Foreshortening: LV appears round — move probe laterally and/or use lower ICS", "RV should be smaller than LV; RV:LV ratio >0.6 suggests RV dilation"],
    pitfalls: ["Foreshortening is the most common error", "Apex not at top → incorrect volumes"],
    measurements: ["LV volumes (biplane Simpson)", "EF", "GLS", "E, A, DT", "e' septal/lateral", "TAPSE", "RV FAC"],
    color: "#24d2d8",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah5" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, pointing up -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#d97706"/>
      <!-- Notch toward left (patient's left = image right) -->
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="116" y2="143" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah5)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Apex, 5th ICS MCL → notch 3 o'clock</text>
    </svg>`,
  },
  {
    id: "a2c", name: "Apical 2-Chamber", abbr: "A2C",
    probePosition: "Cardiac apex — rotate 60° CCW from A4C",
    probeOrientation: "Marker toward 12 o'clock (superior)",
    structures: ["LV (anterior and inferior walls)", "LA", "Mitral valve", "LAA"],
    doppler: "PW at MV tips; Color for MR",
    tips: ["Rotate CCW from A4C until RV disappears — only LV and LA visible", "Anterior wall (top) and inferior wall (bottom) in this view", "LAA best seen with slight posterior tilt"],
    pitfalls: ["Oblique cut includes RV — rotate further CCW", "Inferior wall foreshortening"],
    measurements: ["LV volume (biplane Simpson)", "LAA assessment"],
    color: "#28dce0",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah6" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, notch toward 12 o'clock -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#be185d"/>
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="94" y2="135" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah6)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Rotate 60° CCW from A4C → notch 12 o'clock</text>
    </svg>`,
  },
  {
    id: "a3c", name: "Apical 3-Chamber (APLAX)", abbr: "A3C",
    probePosition: "Cardiac apex — rotate 30° CCW from A2C",
    probeOrientation: "Marker toward 10–11 o'clock",
    structures: ["LV", "LA", "LVOT", "Aortic valve", "Ascending aorta"],
    doppler: "PW in LVOT (VTI); CW through AV",
    tips: ["APLAX = apical long axis — shows LVOT and AV from apex", "Align Doppler cursor parallel to LVOT flow for accurate VTI", "Anteroseptal (top) and inferolateral (bottom) walls visible"],
    pitfalls: ["Underalignment of Doppler cursor underestimates VTI by up to 30%", "Confusion with A2C"],
    measurements: ["LVOT VTI", "AVA (continuity equation)", "AV peak/mean gradient"],
    color: "#30e0e4",
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah7" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <ellipse cx="100" cy="115" rx="82" ry="98" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="100" y1="28" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,3"/>
      <path d="M100,122 Q58,127 44,143" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <path d="M100,142 Q60,147 48,160" fill="none" stroke="#cbd5e1" stroke-width="1.2"/>
      <!-- Probe at apex, notch toward 10-11 o'clock -->
      <rect x="86" y="155" width="16" height="28" rx="4" fill="#c2410c"/>
      <circle cx="94" cy="154" r="4" fill="#4ad9e0"/>
      <line x1="94" y1="154" x2="76" y2="138" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah7)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Rotate 120° CCW from A4C → notch 10–11 o'clock</text>
    </svg>`,
  },
  {
    id: "subcostal", name: "Subcostal", abbr: "Sub",
    probePosition: "Subxiphoid, angled toward left shoulder at 45°",
    probeOrientation: "Marker toward patient's left",
    structures: ["IVC", "RA", "RV", "Atrial septum", "Pericardium", "Liver"],
    doppler: "M-mode IVC for RAP estimation; Hepatic vein PW",
    tips: ["IVC < 2.1 cm + >50% collapse = RAP 0–5 mmHg (normal)", "IVC > 2.1 cm + <50% collapse = RAP 15 mmHg (elevated)", "Best view for pericardial effusion and tamponade", "Ask patient to sniff for IVC collapsibility"],
    pitfalls: ["Hepatic vein mistaken for IVC", "Difficult in obese patients — try lateral decubitus"],
    measurements: ["IVC diameter", "IVC collapsibility index", "RAP estimate"],
    color: "#38e4e8",
    transducerImageUrl: CDN.tteSubcostal,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah8" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <!-- Abdomen outline -->
      <ellipse cx="100" cy="140" rx="85" ry="72" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Xiphoid process -->
      <path d="M100,68 L95,85 L100,95 L105,85 Z" fill="#cbd5e1" opacity="0.5"/>
      <!-- Probe flat on abdomen, angled up -->
      <rect x="72" y="90" width="52" height="14" rx="4" fill="#64748b" transform="rotate(-15,98,97)"/>
      <!-- Notch toward patient's left -->
      <circle cx="74" cy="88" r="4" fill="#4ad9e0"/>
      <line x1="74" y1="88" x2="54" y2="72" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah8)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Subxiphoid, probe flat, angled superiorly</text>
    </svg>`,
  },
  {
    id: "suprasternal", name: "Suprasternal", abbr: "SSN",
    probePosition: "Suprasternal notch, angled inferiorly",
    probeOrientation: "Marker toward left (sagittal plane)",
    structures: ["Aortic arch", "Innominate artery", "Left carotid artery", "Left subclavian artery", "Descending aorta", "RPA (cross-section)"],
    doppler: "CW Doppler in descending aorta (diastolic flow reversal in AR); coarctation gradient",
    tips: ["Extend patient's neck with shoulder roll for better access", "Aortic arch visible as 'candy cane' shape", "Diastolic flow reversal in descending aorta = significant AR"],
    pitfalls: ["Difficult in short necks or COPD", "Probe pressure may cause discomfort"],
    measurements: ["Aortic arch diameter", "Descending aorta diastolic flow reversal"],
    color: "#4ad9e0",
    transducerImageUrl: CDN.tteSsn,
    probeSvg: `<svg viewBox="0 0 200 230" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-height:200px">
      <defs><marker id="ah9" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#4ad9e0"/></marker></defs>
      <!-- Neck/chest outline -->
      <path d="M68,42 Q58,22 100,17 Q142,22 132,42 L142,130 Q100,152 58,130 Z" fill="none" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Clavicles -->
      <line x1="58" y1="85" x2="100" y2="74" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="142" y1="85" x2="100" y2="74" stroke="#cbd5e1" stroke-width="1.5"/>
      <!-- Probe in suprasternal notch -->
      <rect x="82" y="65" width="36" height="14" rx="4" fill="#1d4ed8" transform="rotate(-20,100,72)"/>
      <circle cx="84" cy="63" r="4" fill="#4ad9e0"/>
      <line x1="84" y1="63" x2="65" y2="50" stroke="#4ad9e0" stroke-width="1.8" marker-end="url(#ah9)"/>
      <text x="100" y="218" text-anchor="middle" font-size="10" fill="#64748b" font-family="sans-serif">Suprasternal notch, neck extended</text>
    </svg>`,
  },
];

// ─── Fetal Echo Views ─────────────────────────────────────────────────────────
const fetalViews = [
  {
    id: "abdominal-situs", step: 1,
    name: "Abdominal Situs View", abbr: "Situs",
    description: "The first step in fetal cardiac evaluation. Confirms normal situs solitus — stomach on left, liver on right, aorta left of spine, IVC right of spine. Situs abnormalities are strongly associated with complex congenital heart disease.",
    imageUrl: CDN.abdominalSitusDiagram,
    echoImageUrl: CDN.echoAbdominalSitus,
    structures: ["Stomach (left)", "Liver (right)", "Descending aorta (left of spine)", "IVC (right of spine)", "Umbilical vein", "Spine (posterior)"],
    normalFindings: ["Stomach bubble on LEFT side of fetus", "Aorta to LEFT of spine, IVC to RIGHT", "Liver on right, stomach on left", "Umbilical vein entering liver anteriorly"],
    technique: "Transverse view of fetal abdomen at level of stomach. Identify spine posteriorly. Confirm stomach on left and aorta/IVC positions relative to spine.",
    doppler: "Color Doppler to confirm aorta (pulsatile) vs. IVC (venous) positions relative to spine",
    pitfalls: ["Fetal position may make left/right orientation confusing — always reference spine first", "Absent stomach may indicate esophageal atresia or diaphragmatic hernia"],
    redFlags: ["Stomach on RIGHT (situs inversus or heterotaxy)", "Stomach absent (esophageal atresia, CDH)", "Aorta and IVC on same side (asplenia/polysplenia)", "Midline stomach (heterotaxy)"],
    color: "#189aa1",
  },
  {
    id: "4cv", step: 2,
    name: "Four Chamber View", abbr: "4CV",
    description: "The most important screening view in fetal echo. Obtained from a transverse cross-section of the fetal thorax at the level of the AV valves. The heart should occupy approximately 1/3 of the thoracic area.",
    imageUrl: CDN.fourChamber,
    echoImageUrl: CDN.echoFourChamber,
    structures: ["LV (left, posterior)", "RV (right, anterior)", "LA (posterior left)", "RA (posterior right)", "Mitral valve", "Tricuspid valve", "IVS", "IAS with foramen ovale flap", "Descending aorta (posterior to spine)"],
    normalFindings: ["LV and RV roughly equal in size (RV slightly larger in fetus)", "Foramen ovale flap opens toward LA", "Apex points toward left anterior chest wall (levocardia)", "Descending aorta posterior-left to spine", "Pulmonary veins entering LA (2 on each side)"],
    technique: "Transverse sweep from abdomen (situs view) cranially until 4 chambers are visible. Maintain transverse plane — do not oblique.",
    doppler: "Color Doppler across AV valves for regurgitation. PW at MV and TV tips for E/A ratio.",
    pitfalls: ["Dextrocardia vs dextroposition — check situs first", "Foramen ovale flap mistaken for ASD — flap should bow toward LA", "Oblique cut may make chambers appear unequal"],
    redFlags: ["Cardiomegaly (>1/3 thorax)", "Unequal chamber sizes", "Absent or abnormal foramen ovale flap", "Pericardial effusion", "Echogenic focus (EIF)", "Cardiac axis >60°"],
    color: "#1ba8b0",
  },
  {
    id: "lvot", step: 3,
    name: "LVOT View", abbr: "LVOT",
    description: "Obtained by rotating the transducer slightly from the 4CV to bring the LVOT into view. Confirms the aorta arises from the LV (ventriculo-arterial concordance) and crosses the RVOT.",
    imageUrl: CDN.lvot,
    echoImageUrl: CDN.echoLvot,
    structures: ["LV", "RV", "LA", "Ascending aorta (ASC AO)", "LVOT", "Pulmonary veins (entering LA)", "Descending aorta (DESC AO)"],
    normalFindings: ["Aorta arises from LV — continuity between IVS and anterior aortic wall", "Aorta crosses rightward over the RVOT", "Ascending aorta smaller than MPA in fetus", "Pulmonary veins visible entering LA posteriorly"],
    technique: "From 4CV, rotate transducer slightly clockwise (or tilt anteriorly) until the aortic root comes into view arising from the LV. The LVOT should be parallel to the ultrasound beam.",
    doppler: "PW Doppler in LVOT for velocity. Color Doppler to confirm antegrade flow from LV to aorta.",
    pitfalls: ["Overangulation brings in RVOT instead of LVOT", "Aorta appears to arise from RV in TGA — confirm with RVOT view"],
    redFlags: ["Aorta arising from RV (TGA)", "Overriding aorta (TOF)", "Aortic stenosis — turbulent LVOT flow", "Small ascending aorta (HLHS)"],
    color: "#1db6bf",
  },
  {
    id: "rvot", step: 4,
    name: "RVOT View", abbr: "RVOT",
    echoImageUrl: CDN.echoRvot,
    description: "Confirms the pulmonary artery arises from the RV. The MPA is normally larger than the ascending aorta in the fetus. The PA bifurcates into LPA and RPA.",
    imageUrl: CDN.rvot,
    structures: ["RV", "Main pulmonary artery (MPA/PA)", "Ascending aorta (ASC AO)", "Superior vena cava (SVC)", "Descending aorta (DESC AO)"],
    normalFindings: ["PA arises from RV — larger than ascending aorta in fetus", "PA bifurcates into LPA and RPA", "ASC AO and SVC visible as smaller circles to the right of PA", "DESC AO visible as small circle in lower left"],
    technique: "From LVOT view, continue rotating/tilting anteriorly until PA comes into view arising from RV. The PA should be seen bifurcating.",
    doppler: "PW Doppler in MPA for velocity. Color Doppler to confirm antegrade flow from RV to PA.",
    pitfalls: ["PA arising from LV in TGA — confirm with LVOT view", "Pulmonary stenosis — turbulent flow in MPA"],
    redFlags: ["PA arising from LV (TGA)", "Small PA (pulmonary atresia/stenosis)", "PA = Ao size (abnormal)", "Absent PA bifurcation"],
    color: "#20c4ce",
  },
  {
    id: "rvot-bifurcation", step: 5,
    name: "RVOT with MPA Bifurcation", abbr: "MPA Bifurc",
    echoImageUrl: CDN.echoRvotBifurcation,
    description: "A slightly superior view from the RVOT showing the main pulmonary artery bifurcating into the right and left pulmonary arteries. Confirms pulmonary artery anatomy and rules out pulmonary atresia.",
    imageUrl: CDN.rvotBifurcation,
    structures: ["RV", "Main PA (MPA)", "Right PA (RPA)", "Left PA (LPA)", "Ascending aorta", "SVC"],
    normalFindings: ["MPA bifurcates into RPA and LPA", "RPA and LPA roughly equal in size", "PA bifurcation visible in same plane"],
    technique: "Slight superior tilt from RVOT view. The PA bifurcation confirms pulmonary artery anatomy and rules out pulmonary atresia.",
    doppler: "Color Doppler at bifurcation; assess RPA and LPA flow",
    pitfalls: ["Absent bifurcation may indicate pulmonary atresia with intact IVS", "Markedly asymmetric branch PAs suggest peripheral PS or absent PA"],
    redFlags: ["Absent bifurcation (pulmonary atresia with intact IVS)", "Markedly asymmetric branch PAs", "Confluent PAs absent (severe TOF with absent PA)"],
    color: "#24d2d8",
  },
  {
    id: "3vv-ductal", step: 6,
    name: "3-Vessel View (3VV) — Ductal", abbr: "3VV",
    description: "A transverse view at the level of the great vessels showing three vessels in a line from left to right: MPA (largest), ascending aorta (medium), and SVC (smallest). The MPA bifurcates in this view.",
    imageUrl: CDN.threeVVDuctal,
    echoImageUrl: CDN.echoThreeVVDuctal,
    structures: ["MPA/Ductus Arteriosus (DA)", "Ascending aorta (ASC AO)", "SVC", "Descending aorta (DESC AO)"],
    normalFindings: ["Three vessels in a line: PA > Ao > SVC (left to right)", "PA is the largest vessel — normally larger than Ao in fetus", "Vessels align in a straight line (abnormal if offset)", "DESC AO in lower left quadrant"],
    technique: "From RVOT view, slide the transducer slightly cranially. The three vessels should appear in a transverse plane. Maintain transverse orientation.",
    doppler: "Color Doppler across all three vessels to confirm antegrade flow. PW in MPA for velocity.",
    pitfalls: ["Only 2 vessels visible — may be at wrong level", "PA and Ao equal in size — abnormal", "Vessels not in a line — offset suggests abnormality"],
    redFlags: ["PA < Ao (pulmonary stenosis/atresia)", "Absent SVC", "Vessels not in a line", "Reversed flow in PA (pulmonary atresia)"],
    color: "#28dce0",
  },
  {
    id: "3vt", step: 7,
    name: "3-Vessel Trachea View (3VT)", abbr: "3VT",
    description: "A transverse view at the level of the superior mediastinum showing the relationship of the three vessels to the trachea. Critical for detecting vascular rings and abnormal vessel arrangements.",
    imageUrl: CDN.threeVT,
    echoImageUrl: CDN.echoThreeVT,
    structures: ["MPA / ductal arch", "Transverse aortic arch", "SVC", "Trachea (echogenic ring)", "Descending aorta"],
    normalFindings: ["Aortic arch curves to the left of the trachea (left aortic arch)", "Three vessels form a 'V' shape pointing to the right", "Trachea is a small echogenic ring to the right of the aortic arch", "SVC is the rightmost vessel"],
    technique: "Slide cranially from 3VV until the trachea becomes visible as an echogenic ring. The aortic arch should be seen curving to the left.",
    doppler: "Color Doppler to confirm flow direction in all vessels.",
    pitfalls: ["Right aortic arch: arch curves to the right of trachea — abnormal", "Double aortic arch: vessels on both sides of trachea", "Trachea not identified — may be at wrong level"],
    redFlags: ["Right aortic arch (curves right of trachea)", "Double aortic arch", "Aberrant subclavian artery", "Vascular ring encircling trachea"],
    color: "#30e0e4",
  },
  {
    id: "lbvc", step: 8,
    name: "LBVC View", abbr: "LBVC",
    description: "A superior transverse sweep above the 3VT level showing the left brachiocephalic vein (LBVC) crossing from left to right to join the SVC. The thymus is visible anteriorly. This view is obtained immediately after the 3VT by sliding the transducer slightly cranially.",
    imageUrl: CDN.bcv,
    echoImageUrl: CDN.echoLbvc,
    structures: ["Left brachiocephalic vein (LBVC)", "SVC", "Thymus", "Brachiocephalic arteries", "Trachea (T)"],
    normalFindings: ["LBVC crosses midline from left to right to join SVC", "Thymus visible as gray structure anterior to vessels", "3 brachiocephalic arteries visible below LBVC", "Trachea to right side"],
    technique: "Superior transverse sweep above 3VT level. The LBVC appears as a horizontal vessel crossing from left to right, anterior to the aortic arch vessels.",
    doppler: "Color Doppler to confirm LBVC flow direction (left to right into SVC); assess thymic size",
    pitfalls: ["Absent LBVC may drain anomalously — TAPVR, heterotaxy", "Dilated LBVC suggests increased flow — PAPVR, AVM"],
    redFlags: ["Absent LBVC (may drain anomalously — TAPVR, heterotaxy)", "Dilated LBVC (increased flow — PAPVR, AVM)", "Absent thymus (22q11 DiGeorge)", "Persistent LSVC (LBVC absent, vertical vein present instead)"],
    color: "#38e4e8",
  },
  {
    id: "lv-short-axis", step: 9,
    name: "LV Short Axis View", abbr: "LV SAX",
    description: "A transverse view at the mid-ventricular level showing the left ventricle in short axis. The LV appears circular with the RV wrapping around it anteriorly. Used to assess ventricular size, wall thickness, and systolic function.",
    imageUrl: CDN.echoLvShortAxis,
    echoImageUrl: CDN.echoLvShortAxis,
    structures: ["LV (circular)", "RV (crescent-shaped, anterior)", "Interventricular septum (IVS)", "Posterior wall", "Papillary muscles (at mid level)"],
    normalFindings: ["LV appears circular in cross-section", "RV wraps around anterior LV", "Symmetric wall thickness", "Normal papillary muscle position at mid level", "Concentric contraction on M-mode"],
    technique: "Transverse plane at mid-ventricular level. Tilt caudally from 4CV until LV appears circular with papillary muscles visible. Avoid oblique cuts that make LV appear oval.",
    doppler: "Not typically used; M-mode through LV at papillary muscle level for fractional shortening",
    pitfalls: ["Oblique cut makes LV appear oval — foreshortens measurements", "Papillary muscles may be confused for VSD or mass", "Difficult to obtain in late gestation due to fetal position"],
    redFlags: ["Asymmetric wall thickness (hypertrophic cardiomyopathy)", "Dilated LV (cardiomyopathy, severe AR/MR)", "Echogenic foci in LV (normal variant vs. cardiac rhabdomyoma)", "Hypoplastic LV (HLHS)"],
    color: "#3de8e8",
  },
  {
    id: "rvot-short-axis", step: 10,
    name: "RVOT Short Axis View", abbr: "RVOT SAX",
    description: "A transverse view at the base of the heart showing the RVOT, pulmonary valve, and main pulmonary artery with its bifurcation into RPA and LPA. Also shows the aortic root in cross-section and the ductus arteriosus.",
    imageUrl: CDN.echoRvotShortAxis,
    echoImageUrl: CDN.echoRvotShortAxis,
    structures: ["RV", "RVOT", "Pulmonary valve", "Main PA", "RPA", "LPA", "Aortic root (AO, circular)", "RA", "Ductus Arteriosus (DA)"],
    normalFindings: ["Aortic root appears circular (AO) with PA wrapping around it", "PA bifurcates into RPA and LPA", "DA connects PA to descending aorta", "RV and RA visible", "PA diameter ≥ Ao diameter in normal fetus"],
    technique: "Transverse plane at base of heart. Tilt cranially from 3VV level. The aortic root appears as a circle with the RVOT/PA wrapping around it anteriorly — the classic 'circle and sausage' appearance.",
    doppler: "Color/PW Doppler across pulmonary valve; CW for peak velocity; assess DA flow direction",
    pitfalls: ["PA may appear smaller than Ao if oblique — ensure true transverse cut", "DA may be confused with LPA — trace vessel to descending aorta to confirm"],
    redFlags: ["PA smaller than Ao (pulmonary stenosis/atresia, TOF)", "Absent pulmonary valve", "Reversed DA flow (critical pulmonary obstruction)", "Absent LPA or RPA"],
    color: "#42e8e4",
  },
  {
    id: "bicaval", step: 11,
    name: "Bicaval View", abbr: "Bicaval",
    description: "A sagittal or near-sagittal view through the right side of the fetus showing both the SVC and IVC draining into the right atrium. Best view for assessing venous return and foramen ovale.",
    imageUrl: CDN.bicaval,
    echoImageUrl: CDN.echoBicaval,
    structures: ["RA", "SVC (right side)", "IVC (left side)", "LA", "Right pulmonary artery (RPA)", "Aorta (AO)"],
    normalFindings: ["SVC and IVC both drain into RA", "Foramen ovale flap visible in LA", "RPA visible in cross-section", "IVC and SVC enter RA from opposite ends"],
    technique: "Sagittal or near-sagittal plane through right side of fetus. Rotate from transverse to align with IVC/SVC axis.",
    doppler: "Color Doppler to confirm SVC and IVC flow into RA; assess foramen ovale shunting",
    pitfalls: ["SVC absent (left SVC only — persistent LSVC)", "IVC interruption with azygos continuation (polysplenia)", "Dilated coronary sinus (persistent LSVC)"],
    redFlags: ["SVC absent (persistent LSVC only)", "IVC interruption with azygos continuation (polysplenia)", "Dilated coronary sinus (persistent LSVC)", "ASD/sinus venosus defect"],
    color: "#4ad9e0",
  },
  {
    id: "aortic-arch", step: 12,
    name: "Aortic Arch View (Long Axis)", abbr: "Ao Arch",
    description: "A sagittal view through the left side of the fetus showing the aortic arch in long axis. The classic 'candy cane' shape confirms left aortic arch. Three head and neck vessels arise from the arch.",
    imageUrl: CDN.aorticArch,
    echoImageUrl: CDN.echoAorticArch,
    structures: ["Ascending aorta (ASC AO)", "Aortic arch", "Descending aorta (DESC AO)", "RA", "Right pulmonary artery (RPA)"],
    normalFindings: ["Candy-cane shape of aortic arch", "3 head/neck vessels arising from arch (innominate, LCCA, LSCA)", "Aortic isthmus visible between LSCA and ductus", "Left-sided arch (curves to left of trachea)"],
    technique: "Sagittal plane through left side of fetus. Align with aortic arch long axis — should see the classic candy-cane curve.",
    doppler: "CW/PW at aortic isthmus; retrograde or absent diastolic flow = coarctation/critical obstruction",
    pitfalls: ["Ductal arch may be confused with aortic arch — ductal arch is more vertical (hockey stick)", "Only 2 head vessels visible suggests aberrant subclavian artery"],
    redFlags: ["Right aortic arch (mirror image — 22q11, TOF)", "Coarctation — narrowing at isthmus", "Interrupted aortic arch — gap in arch", "Only 2 head vessels (aberrant subclavian)"],
    color: "#3ecfd6",
  },
  {
    id: "ductal-arch", step: 13,
    name: "Long Axis Ductal Arch View", abbr: "Ductal Arch",
    description: "A sagittal view showing the ductus arteriosus connecting the pulmonary artery to the descending aorta. The ductal arch has a characteristic 'hockey stick' shape — more vertical and acute than the aortic arch.",
    imageUrl: CDN.ductalArch,
    echoImageUrl: CDN.echoDuctalArch,
    structures: ["RV", "Pulmonary valve", "Ductus Arteriosus", "Descending aorta (DESC AO)", "Aortic root (LA)"],
    normalFindings: ["Hockey-stick shape (more acute angle than aortic arch)", "Ductus connects PA directly to descending aorta", "No head/neck vessels arising from ductal arch", "RV and pulmonary valve visible at origin"],
    technique: "Sagittal plane through right side of fetus. The ductal arch is more vertical and acute than the aortic arch — hockey-stick vs. candy-cane.",
    doppler: "PW/Color Doppler in ductus; reversed or absent flow = critical right heart obstruction",
    pitfalls: ["Ductal arch confused with aortic arch — DA is more anterior and vertical", "Absent DA may indicate pulmonary hypertension or premature closure"],
    redFlags: ["Absent ductus (isolated ductal absence — rare)", "Constricted ductus (NSAIDs, indomethacin exposure)", "Reversed ductal flow (critical pulmonary stenosis/atresia)", "Aneurysmal ductus"],
    color: "#189aa1",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function TTEViewCard({ view, isSelected, onClick }: { view: typeof tteViews[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
      style={isSelected ? { background: view.color, color: "white" } : { color: "#475569" }}
    >
      <span className="text-xs font-mono font-bold w-14 shrink-0"
        style={isSelected ? { color: "rgba(255,255,255,0.85)" } : { color: view.color }}>
        {view.abbr}
      </span>
      <span className="text-xs leading-tight">{view.name}</span>
    </button>
  );
}

function FetalViewCard({ view, isSelected, onClick }: { view: typeof fetalViews[0]; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-2"
      style={isSelected ? { background: view.color, color: "white" } : { color: "#475569" }}
    >
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={isSelected ? { background: "rgba(255,255,255,0.25)", color: "white" } : { background: view.color + "20", color: view.color }}>
        {view.step}
      </span>
      <span className="text-xs leading-tight">{view.name}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScanCoach() {
  const [activeTab, setActiveTab] = useState<"tte" | "fetal">("tte");
  const [selectedTTE, setSelectedTTE] = useState(tteViews[0]);
  const [selectedFetal, setSelectedFetal] = useState(fetalViews[0]);
  const fetalDetailRef = useRef<HTMLDivElement>(null);
  const tteDetailRef = useRef<HTMLDivElement>(null);

  // Scroll detail panel into view when view changes
  useEffect(() => {
    if (fetalDetailRef.current) {
      fetalDetailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedFetal]);

  useEffect(() => {
    if (tteDetailRef.current) {
      tteDetailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedTTE]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#189aa1" }}>
            <Scan className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>Scan Coach</h1>
            <p className="text-sm text-gray-500">View-by-view scanning guides with probe positioning, anatomy, and clinical pearls</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-6">
          {(["tte", "fetal"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={activeTab === tab
                ? { background: "#189aa1", color: "white" }
                : { background: "white", color: "#38e4e8", border: "1px solid #e2e8f0" }}
            >
              {tab === "tte" ? "Adult TTE" : "Fetal Echo"}
            </button>
          ))}
        </div>

        {/* ─── ADULT TTE TAB ─── */}
        {activeTab === "tte" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* View list */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>TTE Views</h3>
                  <p className="text-xs text-gray-400 mt-0.5">9 standard acoustic windows</p>
                </div>
                <div className="p-3 space-y-1">
                  {tteViews.map(v => (
                    <TTEViewCard key={v.id} view={v} isSelected={selectedTTE.id === v.id} onClick={() => setSelectedTTE(v)} />
                  ))}
                </div>
              </div>
            </div>

            {/* Detail panel */}
            <div ref={tteDetailRef} className="lg:col-span-3 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedTTE.color + "30", background: selectedTTE.color + "08" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: selectedTTE.color }}>
                      {selectedTTE.abbr}
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedTTE.name}</h2>
                      <p className="text-xs text-gray-500">{selectedTTE.doppler}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Probe diagram */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Transducer Positioning</h3>
                  {(selectedTTE as any).transducerImageUrl ? (
                    <img
                      src={(selectedTTE as any).transducerImageUrl}
                      alt={`${selectedTTE.name} transducer position`}
                      className="w-full rounded-lg object-contain"
                      style={{ maxHeight: "220px" }}
                    />
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: selectedTTE.probeSvg }} />
                  )}
                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <div><span className="font-semibold text-gray-500">Position: </span>{selectedTTE.probePosition}</div>
                    <div><span className="font-semibold text-gray-500">Notch: </span>{selectedTTE.probeOrientation}</div>
                  </div>
                </div>

                {/* Structures */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: selectedTTE.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Structures</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedTTE.structures.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedTTE.color }}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Measurements */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: selectedTTE.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Key Measurements</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTTE.measurements.map((m, i) => (
                      <span key={i} className="px-2 py-1 rounded text-xs font-mono text-white"
                        style={{ background: selectedTTE.color }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips & Pitfalls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Scanning Tips</h3>
                  <ul className="space-y-2">
                    {selectedTTE.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold mt-0.5">+</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-3" style={{ fontFamily: "Merriweather, serif" }}>Common Pitfalls</h3>
                  <ul className="space-y-2">
                    {selectedTTE.pitfalls.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── FETAL ECHO TAB ─── */}
        {activeTab === "fetal" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Fetal detail panel — order-first on mobile so it appears at top */}
            <div ref={fetalDetailRef} className="lg:col-span-3 lg:order-2 order-1 space-y-4">
              {/* Header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b" style={{ borderColor: selectedFetal.color + "30", background: selectedFetal.color + "08" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: selectedFetal.color }}>
                        {selectedFetal.step}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "Merriweather, serif" }}>{selectedFetal.name}</h2>
                        <p className="text-xs text-gray-500">Fetal Echocardiography View Guide</p>
                      </div>
                    </div>
                    {/* Navigation */}
                    <div className="flex gap-2">
                      {selectedFetal.step > 1 && (
                        <button onClick={() => setSelectedFetal(fetalViews[selectedFetal.step - 2])}
                          className="px-3 py-1 rounded text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                          ← Prev
                        </button>
                      )}
                      {selectedFetal.step < fetalViews.length && (
                        <button onClick={() => setSelectedFetal(fetalViews[selectedFetal.step])}
                          className="px-3 py-1 rounded text-xs text-white transition-colors"
                          style={{ background: selectedFetal.color }}>
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedFetal.description}</p>
                </div>
              </div>

              {/* Diagram + Echo image */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>View Reference Images</h3>
                  <span className="text-xs text-gray-400">Diagram · Clinical Echo</span>
                </div>
                <div className="grid grid-cols-2 gap-0 bg-gray-950">
                  <div className="flex justify-center items-center p-3 border-r border-gray-800">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Anatomy Diagram</p>
                      <img
                        src={selectedFetal.imageUrl}
                        alt={`${selectedFetal.name} diagram`}
                        className="max-h-60 object-contain rounded"
                        style={{ background: "#030712" }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center items-center p-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-1.5">Clinical Echo Image</p>
                      <img
                        src={(selectedFetal as any).echoImageUrl || selectedFetal.imageUrl}
                        alt={`${selectedFetal.name} echo`}
                        className="max-h-60 object-contain rounded"
                        style={{ background: "#030712" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Structures */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="w-4 h-4" style={{ color: selectedFetal.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Structures to Identify</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.structures.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: selectedFetal.color }}></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Normal Findings */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4" style={{ color: selectedFetal.color }} />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Normal Findings</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.normalFindings.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Technique + Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <h3 className="font-bold text-sm text-gray-700 mb-2" style={{ fontFamily: "Merriweather, serif" }}>Scanning Technique</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedFetal.technique}</p>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Doppler</h4>
                    <p className="text-sm text-gray-600">{selectedFetal.doppler}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <h4 className="font-semibold text-xs text-gray-500 mb-1 uppercase tracking-wide">Common Pitfalls</h4>
                    <ul className="space-y-1">
                      {selectedFetal.pitfalls.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                          <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Red Flags */}
                <div className="bg-white rounded-xl border border-red-50 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Red Flags / Abnormal Findings</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {selectedFetal.redFlags.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                        <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">!</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Copyright */}
              <div className="text-xs text-gray-400 text-center py-2">
                Clinical images © All About Ultrasound, Inc. / iHeartEcho — Lara Williams, BS, ACS, RCCS, RDCS, RVT, RDMS, FASE. Educational use only.
              </div>
            </div>
            {/* View list sidebar — order-2 on mobile so detail panel shows first */}
            <div className="lg:col-span-1 lg:order-1 order-2 space-y-2">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-sm text-gray-700" style={{ fontFamily: "Merriweather, serif" }}>Fetal Echo Views</h3>
                  <p className="text-xs text-gray-400 mt-0.5">13-view sweep sequence</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 italic">Lara Williams, BS, ACS, RCCS, RDCS, RVT, RDMS, FASE</p>
                </div>
                {/* Sweep overview image */}
                <div className="p-2">
                  <img src={CDN.sweep} alt="Fetal echo sweep overview" className="w-full rounded-lg object-contain bg-gray-900" style={{ maxHeight: "120px" }} />
                </div>
                <div className="p-3 space-y-1">
                  {fetalViews.map(v => (
                    <FetalViewCard key={v.id} view={v} isSelected={selectedFetal.id === v.id} onClick={() => setSelectedFetal(v)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
