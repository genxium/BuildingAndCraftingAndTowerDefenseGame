package iap

import (
	"crypto/x509"
	"encoding/asn1"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"github.com/fullsailor/pkcs7"
	utils "server/common/utils"
	"server/models"
	"strconv"
	"strings"
)

//  Field name reference
//    - https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ValidateLocally.html#//apple_ref/doc/uid/TP40010573-CH1-SW3.

// These structs serve the same purpose to Golang runtime as "/samedir/*.asn1" to "asn1c CLI program".
type ReceiptAttribute struct {
	// ReceiptAttribute ::= SEQUENCE {
	//     type    INTEGER,
	//     version INTEGER,
	//     value   OCTET STRING
	// }
	Type    int    `asn1:"omitempty"`
	Version int    `asn1:"omitempty"`
	Value   []byte `asn1:"omitempty"`
}

//  Type annotation references
//    - https://golang.org/pkg/encoding/asn1/#Marshal.
//    - https://golang.org/pkg/encoding/asn1/#Unmarshal.

// Payload ::= SET OF ReceiptAttribute
type Payload []ReceiptAttribute

/*
* Note that you could be facing the following errors if "asn.1 types/tags" not respected carefully.
*   - (17 vs {class:0 tag:16 length:10 isCompound:true}) {optional:false explicit:false application:false private:false defaultValue:<nil> tag:<nil> stringType:0 timeType:0 set:true omitEmpty:true}
*   - (16 vs {class:0 tag:17 length:10 isCompound:true}) {optional:false explicit:false application:false private:false defaultValue:<nil> tag:<nil> stringType:0 timeType:0 set:true omitEmpty:true}
*
* The former number is the type/tag (defined in https://golang.org/pkg/encoding/asn1/#pkg-constants) you manually set for the "receiving struct to expect", whilst the latter is the type/tag and other meta info parsed from the actual data.
*
* I've chosen an easy and by far only known way to unmarshal the "Payload", you might try out
*
* ```
* type Payload struct {
*   ReceiptAttributeList []ReceiptAttribute `asn1:"omitempty"`
* }
* ```
* or
*
* ```
* type Payload struct {
*   ReceiptAttributeList []ReceiptAttribute `asn1:"set,omitempty"`
*   // Annotation "set" causes a SET, rather than a SEQUENCE type to be expected.
* }
* ```
*
* combined later with
*
* ```
* asn1.UnmarshalWithParams(envelope.Content, &wholePayload, "set")
* ```
* or

* ```
* asn1.Unmarshal(envelope.Content, &wholePayload)
* ```
*
* to seek alternative solutions.
*
* -- YFLu, 2019-02-05
 */

type InAppAttribute struct {
	// InAppAttribute ::= SEQUENCE {
	//     type                   INTEGER,
	//     version                INTEGER,
	//     value                  OCTET STRING
	// }
	Type    int    `asn1:"omitempty"`
	Version int    `asn1:"omitempty"`
	Value   []byte `asn1:"omitempty"`
}

// InAppReceipt ::= SET OF InAppAttribute
type InAppReceipt []InAppAttribute

func Asn1Decode(receiptB64Encoded string) (map[string]*models.AppleIapRecord, error) {
	data, err := base64.StdEncoding.DecodeString(receiptB64Encoded)
	if err != nil {
		fmt.Printf("Error when decoding b64encoded receipt\n%v\n", err)
		return nil, err
	}

	envelope, err := pkcs7.Parse(data)
	if err != nil {
		fmt.Printf("Error when parsing PKCS#7 envelope\n%v\n", err)
		return nil, err
	}
	// fmt.Printf("PKCS#7 parsed with extracted Payload in hexdump\n%v\n", hex.EncodeToString(envelope.Content));

	certs := envelope.Certificates
	fmt.Printf("\nThere're  %d certs contained in the receipt envelope.\n", len(certs))
	for _, cert := range certs {
		// Reference https://godoc.org/crypto/x509#Certificate.
		fmt.Printf("```\n\tSerialNumber: %s\n\tIssuer: %s\n\tSubject: %s\n\tNotBefore: %s\n\tNotAfter: %s\n\tKeyUsage: %v\n\tIsCA: %v\n```\n", cert.SerialNumber, cert.Issuer, cert.Subject, cert.NotBefore, cert.NotAfter, cert.KeyUsage, cert.IsCA)
	}
	// I magically know the order of cert appearance :)
	untrustedAppleRootCert := certs[2] // Self-signed, not useful.
	if nil == untrustedAppleRootCert {
		//TODO trow new error
		return nil, nil
	}
	fmt.Println("We have a self-signed `untrustedAppleRootCert` contained in the envelope.")

	wwdrCert := certs[1]          // Signed by `untrustedAppleRootCert`, and we'll soon verify it by the downloaded `trustedAppleRootCert`.
	payloadSignerCert := certs[0] // Signed by `wwdrCert` and is used to sign the `wholePayload`.

	err = envelope.Verify()
	if err != nil {
		fmt.Printf("Error when verifying PKCS#7 signature by the signing pubkey provided in the envelope\n%v\n", err)
		return nil, err
	}
	fmt.Println("The PKCS#7 signature is valid if the signing pubkey provided in the envelope were valid.\n")

	intermediates := x509.NewCertPool()
	intermediates.AddCert(wwdrCert)

	opts := x509.VerifyOptions{
		Roots:         TrustedCertManagerIns.AppleRootCertPool,
		Intermediates: intermediates,
	}

	if _, err = payloadSignerCert.Verify(opts); err != nil {
		fmt.Printf("Error when verifying PKCS#7 cert chain against downloaded trustedAppleRootCert.\n%v\n", err)
		return nil, err
	}

	fmt.Printf("PKCS#7 cert chain verified against downloaded trustedAppleRootCert.\n")

	wholePayload := Payload([]ReceiptAttribute{})
	/*
	 * Doesn't work with simply
	 *
	 * ```
	 * _, err = asn1.Unmarshal(envelope.Content, &wholePayload)
	 * ```
	 *
	 * and will result in "asn.1 type/tag mismatch error".
	 *
	 * See https://golang.org/src/encoding/asn1/asn1.go and put some breakpoints around the error message spot if you want to know more about the subtleties.
	 */
	_, err = asn1.UnmarshalWithParams(envelope.Content, &wholePayload, "set")
	if err != nil {
		fmt.Println("Error when decoding the asn1-encoded envelope.Content", err)
		return nil, err
	}
	appleIapRecords := make(map[string]*models.AppleIapRecord)
	fmt.Println("The decoded `wholePayload` has `ReceiptAttribute` as follows ")
	fmt.Printf("The decoded `wholePayload` has %v `ReceiptAttribute`s.\n", len(wholePayload))
	for _, receiptAttribute := range wholePayload {
		if 17 == receiptAttribute.Type {
			fmt.Printf("Found an InAppReceipt {Type: %d, Version: %d, Value(hexdump): %s}\n", receiptAttribute.Type, receiptAttribute.Version, hex.EncodeToString(receiptAttribute.Value))
			inAppReceipt := InAppReceipt([]InAppAttribute{})
			_, err = asn1.UnmarshalWithParams(receiptAttribute.Value, &inAppReceipt, "set")
			if err != nil {
				fmt.Println("Error when decoding an asn1-encoded receiptAttribute.Value", err)
				return nil, err
			}
			appleIapRecord := models.AppleIapRecord{}
			for _, inAppAttribute := range inAppReceipt {
				// Reference https://developer.apple.com/library/archive/releasenotes/General/ValidateAppStoreReceipt/Chapters/ReceiptFields.html#//apple_ref/doc/uid/TP40010573-CH106-SW12
				switch inAppAttribute.Type {
				case 1702:
					productIdentifier := strings.TrimFunc(string(inAppAttribute.Value), func(r rune) bool {
						// Some string literals start with []byte{0xc 0x5}, might be padded for codec convenience.
						return r == 0xc || r == 0x5
					})
					appleIapRecord.ProductIdentifier = productIdentifier[1:]
					fmt.Printf("  ProductIdentifier: %s\n", productIdentifier)
					break
				case 1701:
					//HARD CODE
					appleIapRecord.Quantity = 1
					quantity, _ := strconv.Atoi(string(inAppAttribute.Value))
					fmt.Printf("  Quantity: %d\n", quantity)
					quantity2 := hex.EncodeToString(inAppAttribute.Value)
					fmt.Printf("  Quantity hex EncodeToString: %s\n", quantity2)
					fmt.Printf("  Quantity Version: %d\n", inAppAttribute.Version)
					break
				case 1703:
					trxIdentifier := strings.TrimFunc(string(inAppAttribute.Value), func(r rune) bool {
						return r == 0xc || r == 0x5
					})
					appleIapRecord.TransactionIdentifier = trxIdentifier[1:]
					fmt.Printf("  TransactionIdentifier: %s\n", trxIdentifier)
					break
				case 1705:
					trxOriginIdentifier := strings.TrimFunc(string(inAppAttribute.Value), func(r rune) bool {
						return r == 0xc || r == 0x5
					})
					fmt.Printf("  TransactionOriginIdentifier: %s\n", trxOriginIdentifier)
					break
				case 1704:
					purchaseDate := string(inAppAttribute.Value)
					appleIapRecord.CreatedAt, _ = utils.ParseIapPurchaseDate(purchaseDate)
					fmt.Printf("  PurchaseDate: %s\n", purchaseDate)
					break
				default:
					break
				}
			}

			if appleIapRecord.Quantity != 0 {
				appleIapRecords[appleIapRecord.TransactionIdentifier] = &appleIapRecord
			}
		}
	}
	return appleIapRecords, nil
}
