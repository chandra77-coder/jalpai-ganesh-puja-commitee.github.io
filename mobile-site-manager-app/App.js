import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";

global.Buffer = global.Buffer || Buffer;

const OWNER = "chandra77-coder";
const REPO = "jalpai-ganesh-puja-commitee.github.io";
const BRANCH = "main";
const DATA_PATH = "data/site-manager.json";

const emptyData = {
  site: {
    committeeName: "Jalpai Ganesh Puja Committee",
    shortName: "JGPC",
    year: "2026",
    heroEyebrow: "Official Committee Website · 2026",
    heroSubtitle: "",
    slogan: "",
    dateText: "Ganesh Chaturthi 2026",
    festivalDate: "2026-09-14T00:00:00+05:30",
    logo: "images/logo.png",
    heroImage: "images/current-murti.svg",
  },
  aboutHeading: "",
  aboutIntro: "",
  about: [],
  activities: [],
  gallery: [],
  events: [],
  members: [],
  links: {
    facebook: "",
    facebook2: "",
    youtube: "",
    instagram: "",
    googleMap: "",
    donation: "",
  },
  contact: {
    address: "",
    phone: "",
    email: "",
    whatsapp: "",
  },
  announcement: {
    enabled: false,
    title: "",
    message: "",
    buttonText: "Open",
    buttonLink: "",
  },
};

function decodeBase64Text(value) {
  return Buffer.from(String(value || "").replace(/\n/g, ""), "base64").toString("utf8");
}

function encodeBase64Text(value) {
  return Buffer.from(String(value || ""), "utf8").toString("base64");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export default function App() {
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [data, setData] = useState(emptyData);
  const [sha, setSha] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Open app, connect GitHub, then load website data.");
  const [tab, setTab] = useState("Home");

  const connected = useMemo(() => token.trim().length > 20, [token]);

  useEffect(() => {
    SecureStore.getItemAsync("github_token").then((saved) => {
      if (saved) {
        setToken(saved);
        setTokenInput("Saved securely");
        setStatus("GitHub token found. Tap Load Website Data.");
      }
    });
  }, []);

  function headers() {
    return {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  async function connect() {
    const clean = tokenInput.trim();
    if (!clean || clean === "Saved securely") {
      Alert.alert("Token needed", "Paste your GitHub token inside this app only.");
      return;
    }
    await SecureStore.setItemAsync("github_token", clean);
    setToken(clean);
    setTokenInput("Saved securely");
    setStatus("Token saved securely on this phone. Now tap Load Website Data.");
  }

  async function logout() {
    await SecureStore.deleteItemAsync("github_token");
    setToken("");
    setTokenInput("");
    setSha("");
    setStatus("Token removed from this phone.");
  }

  async function githubGet(path) {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
    const res = await fetch(url, { headers: headers() });
    const text = await res.text();
    if (!res.ok) throw new Error(`GitHub read failed: ${res.status} ${text}`);
    return JSON.parse(text);
  }

  async function githubPut(path, base64Content, fileSha, message) {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
    const body = {
      message,
      content: base64Content,
      branch: BRANCH,
    };
    if (fileSha) body.sha = fileSha;
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`GitHub save failed: ${res.status} ${text}`);
    return JSON.parse(text);
  }

  async function loadWebsiteData() {
    if (!connected) {
      Alert.alert("Connect GitHub first", "Paste your GitHub token and tap Save Token.");
      return;
    }
    setLoading(true);
    try {
      const file = await githubGet(DATA_PATH);
      const json = JSON.parse(decodeBase64Text(file.content));
      setData({ ...clone(emptyData), ...json });
      setSha(file.sha);
      setStatus("Website data loaded. You can edit and save.");
    } catch (err) {
      setStatus(String(err.message || err));
      Alert.alert("Load failed", String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function saveWebsiteData() {
    if (!connected || !sha) {
      Alert.alert("Load first", "Connect GitHub and load website data before saving.");
      return;
    }
    setLoading(true);
    try {
      const clean = clone(data);
      clean.lastUpdated = new Date().toISOString().slice(0, 10);
      clean.managedBy = "mobile-site-manager-app";
      const formatted = JSON.stringify(clean, null, 2);
      JSON.parse(formatted);
      const result = await githubPut(
        DATA_PATH,
        encodeBase64Text(formatted),
        sha,
        `Update website content from mobile app - ${new Date().toLocaleString()}`
      );
      setSha(result.content.sha);
      setData(clean);
      setStatus("Saved successfully. GitHub Pages may take a short time to show the change.");
      Alert.alert("Saved", "Website content was updated successfully.");
    } catch (err) {
      setStatus(String(err.message || err));
      Alert.alert("Save failed", String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(folder, onDone) {
    if (!connected) {
      Alert.alert("Connect GitHub first", "Paste your token and load data first.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo access to upload images.");
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      base64: false,
    });

    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    setLoading(true);
    try {
      const uri = picked.assets[0].uri;
      const extension = uri.split(".").pop()?.toLowerCase()?.replace(/[^a-z0-9]/g, "") || "jpg";
      const safeExtension = ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension : "jpg";
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const path = `${folder}/app-${nowStamp()}.${safeExtension}`;
      await githubPut(path, base64, null, `Upload image from mobile app - ${path}`);
      onDone(path);
      setStatus(`Image uploaded: ${path}. Tap Save Website Data to publish the changed reference.`);
    } catch (err) {
      setStatus(String(err.message || err));
      Alert.alert("Upload failed", String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function setField(path, value) {
    setData((old) => {
      const next = clone(old);
      let ref = next;
      for (let i = 0; i < path.length - 1; i += 1) ref = ref[path[i]];
      ref[path[path.length - 1]] = value;
      return next;
    });
  }

  function setArrayItem(arrayName, index, key, value) {
    setData((old) => {
      const next = clone(old);
      next[arrayName][index][key] = value;
      return next;
    });
  }

  function addItem(arrayName, item) {
    setData((old) => {
      const next = clone(old);
      next[arrayName] = Array.isArray(next[arrayName]) ? next[arrayName] : [];
      next[arrayName].push(item);
      return next;
    });
  }

  function removeItem(arrayName, index) {
    setData((old) => {
      const next = clone(old);
      next[arrayName].splice(index, 1);
      return next;
    });
  }

  const tabs = ["Home", "Announcement", "Gallery", "Events", "Members", "Links", "Contact"];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>JGPC Site Manager</Text>
        <Text style={styles.sub}>Private app for website updates</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.label}>GitHub Token</Text>
          <TextInput
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Paste GitHub token here"
            secureTextEntry={tokenInput !== "Saved securely"}
            style={styles.input}
          />
          <View style={styles.row}>
            <Button text="Save Token" onPress={connect} disabled={loading} />
            <Button text="Remove Token" onPress={logout} secondary disabled={loading} />
          </View>
          <View style={styles.row}>
            <Button text="Load Website Data" onPress={loadWebsiteData} disabled={loading || !connected} />
            <Button text="Save Website Data" onPress={saveWebsiteData} disabled={loading || !connected || !sha} />
          </View>
          <Text style={styles.status}>{loading ? "Working..." : status}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {tabs.map((name) => (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              style={[styles.tab, tab === name && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === name && styles.tabTextActive]}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === "Home" && (
          <View style={styles.card}>
            <Field label="Committee Name" value={data.site.committeeName} onChangeText={(v) => setField(["site", "committeeName"], v)} />
            <Field label="Short Name" value={data.site.shortName} onChangeText={(v) => setField(["site", "shortName"], v)} />
            <Field label="Year" value={data.site.year} onChangeText={(v) => setField(["site", "year"], v)} />
            <Field label="Hero Small Line" value={data.site.heroEyebrow} onChangeText={(v) => setField(["site", "heroEyebrow"], v)} />
            <Field label="Slogan" value={data.site.slogan} onChangeText={(v) => setField(["site", "slogan"], v)} />
            <Field label="Hero Description" value={data.site.heroSubtitle} onChangeText={(v) => setField(["site", "heroSubtitle"], v)} multiline />
            <Field label="Festival Text" value={data.site.dateText} onChangeText={(v) => setField(["site", "dateText"], v)} />
            <Field label="Festival Date ISO" value={data.site.festivalDate} onChangeText={(v) => setField(["site", "festivalDate"], v)} />
            <Text style={styles.help}>Example date: 2026-09-14T00:00:00+05:30</Text>
            <Button text="Upload Hero Photo" onPress={() => uploadImage("images", (path) => setField(["site", "heroImage"], path))} disabled={loading || !connected} />
            <Text style={styles.path}>Hero photo: {data.site.heroImage}</Text>
          </View>
        )}

        {tab === "Announcement" && (
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Show Announcement</Text>
              <Button
                text={data.announcement.enabled ? "ON" : "OFF"}
                onPress={() => setField(["announcement", "enabled"], !data.announcement.enabled)}
                secondary={!data.announcement.enabled}
              />
            </View>
            <Field label="Title" value={data.announcement.title} onChangeText={(v) => setField(["announcement", "title"], v)} />
            <Field label="Message" value={data.announcement.message} onChangeText={(v) => setField(["announcement", "message"], v)} multiline />
            <Field label="Button Text" value={data.announcement.buttonText} onChangeText={(v) => setField(["announcement", "buttonText"], v)} />
            <Field label="Button Link" value={data.announcement.buttonLink} onChangeText={(v) => setField(["announcement", "buttonLink"], v)} />
          </View>
        )}

        {tab === "Gallery" && (
          <View style={styles.card}>
            <Button
              text="Add Gallery Photo Box"
              onPress={() => addItem("gallery", { title: "New Photo", image: "images/photo-new.jpg", caption: "" })}
            />
            {(data.gallery || []).map((item, index) => (
              <View key={`gallery-${index}`} style={styles.item}>
                <Field label={`Photo ${index + 1} Title`} value={item.title} onChangeText={(v) => setArrayItem("gallery", index, "title", v)} />
                <Field label="Image Path" value={item.image} onChangeText={(v) => setArrayItem("gallery", index, "image", v)} />
                <Field label="Caption" value={item.caption} onChangeText={(v) => setArrayItem("gallery", index, "caption", v)} />
                <View style={styles.row}>
                  <Button text="Upload Image" onPress={() => uploadImage("images/gallery", (path) => setArrayItem("gallery", index, "image", path))} disabled={loading || !connected} />
                  <Button text="Remove" onPress={() => removeItem("gallery", index)} secondary />
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "Events" && (
          <View style={styles.card}>
            <Button text="Add Event" onPress={() => addItem("events", { date: "2026-09-14", time: "09:00 AM", title: "New Event", description: "", location: "Jalpai" })} />
            {(data.events || []).map((item, index) => (
              <View key={`event-${index}`} style={styles.item}>
                <Field label="Date" value={item.date} onChangeText={(v) => setArrayItem("events", index, "date", v)} />
                <Field label="Time" value={item.time} onChangeText={(v) => setArrayItem("events", index, "time", v)} />
                <Field label="Title" value={item.title} onChangeText={(v) => setArrayItem("events", index, "title", v)} />
                <Field label="Description" value={item.description} onChangeText={(v) => setArrayItem("events", index, "description", v)} multiline />
                <Field label="Location" value={item.location} onChangeText={(v) => setArrayItem("events", index, "location", v)} />
                <Button text="Remove Event" onPress={() => removeItem("events", index)} secondary />
              </View>
            ))}
          </View>
        )}

        {tab === "Members" && (
          <View style={styles.card}>
            <Button
              text="Add Member"
              onPress={() => {
                const nextId = (data.members?.length || 0) + 1;
                addItem("members", { id: nextId, name: `Member ${nextId}`, role: "Member", code: `member${nextId}`, photo: `images/members/member${nextId}.jpg`, showPhone: false });
              }}
            />
            {(data.members || []).map((item, index) => (
              <View key={`member-${index}`} style={styles.item}>
                <Field label="Name" value={item.name} onChangeText={(v) => setArrayItem("members", index, "name", v)} />
                <Field label="Role" value={item.role} onChangeText={(v) => setArrayItem("members", index, "role", v)} />
                <Field label="Member Code" value={item.code} onChangeText={(v) => setArrayItem("members", index, "code", v)} />
                <Field label="Photo Path" value={item.photo} onChangeText={(v) => setArrayItem("members", index, "photo", v)} />
                <View style={styles.row}>
                  <Button text="Upload Photo" onPress={() => uploadImage("images/members", (path) => setArrayItem("members", index, "photo", path))} disabled={loading || !connected} />
                  <Button text="Remove" onPress={() => removeItem("members", index)} secondary />
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === "Links" && (
          <View style={styles.card}>
            <Field label="Facebook Page 1" value={data.links.facebook} onChangeText={(v) => setField(["links", "facebook"], v)} />
            <Field label="Facebook Page 2" value={data.links.facebook2} onChangeText={(v) => setField(["links", "facebook2"], v)} />
            <Field label="YouTube" value={data.links.youtube} onChangeText={(v) => setField(["links", "youtube"], v)} />
            <Field label="Instagram" value={data.links.instagram} onChangeText={(v) => setField(["links", "instagram"], v)} />
            <Field label="Google Map" value={data.links.googleMap} onChangeText={(v) => setField(["links", "googleMap"], v)} />
            <Field label="Donation Info/Link" value={data.links.donation} onChangeText={(v) => setField(["links", "donation"], v)} />
          </View>
        )}

        {tab === "Contact" && (
          <View style={styles.card}>
            <Field label="Address" value={data.contact.address} onChangeText={(v) => setField(["contact", "address"], v)} multiline />
            <Field label="Phone" value={data.contact.phone} onChangeText={(v) => setField(["contact", "phone"], v)} />
            <Field label="Email" value={data.contact.email} onChangeText={(v) => setField(["contact", "email"], v)} />
            <Field label="WhatsApp" value={data.contact.whatsapp} onChangeText={(v) => setField(["contact", "whatsapp"], v)} />
          </View>
        )}

        <Text style={styles.footerNote}>
          Safety: never paste your GitHub token into public website files. This app stores it only on your phone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, multiline }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={String(value ?? "")}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.multiline]}
        multiline={!!multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

function Button({ text, onPress, secondary, disabled }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.button, secondary && styles.buttonSecondary, disabled && styles.disabled]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff8e7" },
  header: { padding: 18, backgroundColor: "#f1c45b" },
  title: { fontSize: 24, fontWeight: "900", color: "#3a2206" },
  sub: { fontSize: 13, fontWeight: "700", color: "#68430f", marginTop: 2 },
  body: { padding: 14, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(201,141,24,.25)",
  },
  label: { fontWeight: "900", color: "#4f2f08", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(201,141,24,.35)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fffaf0",
    color: "#3a2206",
    fontWeight: "700",
  },
  multiline: { minHeight: 90 },
  field: { marginBottom: 12 },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 10 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  button: {
    backgroundColor: "#c98d18",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginVertical: 3,
  },
  buttonSecondary: { backgroundColor: "#fff4cf", borderWidth: 1, borderColor: "rgba(201,141,24,.35)" },
  buttonText: { color: "#2d1800", fontWeight: "900" },
  buttonTextSecondary: { color: "#68430f" },
  disabled: { opacity: 0.45 },
  status: { color: "#76531c", fontWeight: "800", marginTop: 10, lineHeight: 20 },
  tabs: { marginBottom: 12 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(201,141,24,.25)",
  },
  tabActive: { backgroundColor: "#c98d18" },
  tabText: { color: "#68430f", fontWeight: "900" },
  tabTextActive: { color: "#2d1800" },
  item: {
    padding: 12,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#fffaf0",
    borderWidth: 1,
    borderColor: "rgba(201,141,24,.2)",
  },
  help: { color: "#76531c", marginBottom: 12, fontWeight: "700" },
  path: { color: "#76531c", marginTop: 8, fontWeight: "800" },
  footerNote: { textAlign: "center", color: "#76531c", fontWeight: "800", padding: 14 },
});
