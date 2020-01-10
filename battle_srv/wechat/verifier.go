package wechat

import (
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"math/rand"
	"net/http"
	. "server/common"
	"server/common/utils"
	"sort"
	"time"
)

func extremelySimpleHttpGet(uri string) ([]byte, error) {
	response, err := http.Get(uri)
	if err != nil {
		return nil, err
	}

	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http get error : uri=%v , statusCode=%v", uri, response.StatusCode)
	}
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	return body, err
}

type WechatAuthVerifier struct {
	config  *WechatConf
	channel int64
}

var WechatGameVerifierIns *WechatAuthVerifier

func Init() {
	WechatGameVerifierIns = &WechatAuthVerifier{
		config:  Conf.WechatGameConf,
		channel: Constants.AuthChannel.WechatGame,
	}
}

// CommonError 微信返回的通用错误json
type CommonError struct {
	ErrCode int64  `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

type queryAccessTokenResp struct {
	CommonError
	AccessToken  string `json:"access_token"`
	ExpiresIn    int64  `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	OpenId       string `json:"openid"`
	Scope        string `json:"scope"`
}

// Config 返回给用户jssdk配置信息
type JsConfig struct {
	AppId     string `json:"app_id"`
	Timestamp int64  `json:"timestamp"`
	NonceStr  string `json:"nonce_str"`
	Signature string `json:"signature"`
}

// JsapiTicketResp 请求jsapi_tikcet返回结果
type JsapiTicketResp struct {
	CommonError
	Ticket    string `json:"ticket"`
	ExpiresIn int64  `json:"expires_in"`
}

func (w *WechatAuthVerifier) GetJsConfig(uri string) (*JsConfig, error) {
	ticketResp, err := w.queryJsApiTicket()
	if nil != err {
		return nil, err
	}
	ticketStr := ticketResp.Ticket
	nonceStr := generateNonceStr(16)
	timestamp := utils.UnixtimeSec()
	str := fmt.Sprintf("jsapi_ticket=%s&noncestr=%s&timestamp=%d&url=%s", ticketStr, nonceStr, timestamp, uri)
	sigStr := sha1Sign(str)

	config := new(JsConfig)
	config.AppId = w.config.AppId
	config.NonceStr = nonceStr
	config.Timestamp = timestamp
	config.Signature = sigStr
	return config, nil
}

func (w *WechatAuthVerifier) GetOauth2Basic(authcode string) (*queryAccessTokenResp, error) {
	var accessTokenURL string
	if w.channel == Constants.AuthChannel.WechatGame {
		accessTokenURL = w.config.ApiProtocol + "://" + w.config.ApiGateway + "/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code"
	}
	if w.channel == Constants.AuthChannel.WechatPubsrv {
		accessTokenURL = w.config.ApiProtocol + "://" + w.config.ApiGateway + "/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code"
	}
	urlStr := fmt.Sprintf(accessTokenURL, w.config.AppId, w.config.AppSecret, authcode)
	response, err := extremelySimpleHttpGet(urlStr)
	if nil != err {
		return nil, err
	}
	result := new(queryAccessTokenResp)
	err = json.Unmarshal(response, result)
	if nil != err {
		return nil, err
	}
	return result, nil
}

//UserInfo 用户授权获取到用户信息
type UserInfo struct {
	CommonError
	OpenId     string   `json:"openid"`
	Nickname   string   `json:"nickname"`
	Sex        int32    `json:"sex"`
	Province   string   `json:"province"`
	City       string   `json:"city"`
	Country    string   `json:"country"`
	HeadImgURL string   `json:"headimgurl"`
	Privilege  []string `json:"privilege"`
	Unionid    string   `json:"unionid"`
}

func (w *WechatAuthVerifier) QueryMoreWechatAccountInfo(accessToken string, openId string) (*UserInfo, error) {
	userInfoURL := w.config.ApiProtocol + "://" + w.config.ApiGateway + "/sns/userinfo?appid=%s&access_token=%s&openid=%s&lang=zh_CN"
	urlStr := fmt.Sprintf(userInfoURL, w.config.AppId, accessToken, openId)
	response, err := extremelySimpleHttpGet(urlStr)
	if nil != err {
		return nil, err
	}
	result := new(UserInfo)
	err = json.Unmarshal(response, result)
	if nil != err {
		return nil, err
	}
	return result, nil
}

func sha1Sign(params ...string) string {
	sort.Strings(params)
	h := sha1.New()
	for _, s := range params {
		io.WriteString(h, s)
	}
	return fmt.Sprintf("%x", h.Sum(nil))
}

func generateNonceStr(length int) string {
	str := "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	bytes := []byte(str)
	result := []byte{}
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for i := 0; i < length; i++ {
		result = append(result, bytes[r.Intn(len(bytes))])
	}
	return string(result)
}

func (w *WechatAuthVerifier) queryJsApiTicket() (*JsapiTicketResp, error) {
	accessToken, err := w.queryAccessToken()
	if nil != err || "" == accessToken {
		return nil, err
	}

	queryJsApiTicketURL := w.config.ApiProtocol + "://" + w.config.ApiGateway + "/cgi-bin/ticket/getticket?access_token=%s&type=jsapi"
	var response []byte
	url := fmt.Sprintf(queryJsApiTicketURL, accessToken)
	response, err = extremelySimpleHttpGet(url)
	ticket := new(JsapiTicketResp)
	err = json.Unmarshal(response, ticket)
	if nil != err {
		return nil, err
	}

	return ticket, nil
}

func (w *WechatAuthVerifier) queryAccessToken() (string, error) {
	AccessTokenURL := w.config.ApiProtocol + "://" + w.config.ApiGateway + "/cgi-bin/token"
	url := fmt.Sprintf("%s?grant_type=client_credential&appid=%s&secret=%s", AccessTokenURL, w.config.AppId, w.config.AppSecret)
	body, err := extremelySimpleHttpGet(url)
	if err != nil {
		return "", err
	}
	var r queryAccessTokenResp
	err = json.Unmarshal(body, &r)
	if err != nil {
		return "", err
	}

	return r.AccessToken, nil
}
